goog.provide('os.config.Settings');

goog.require('goog.Promise');
goog.require('goog.Timer');
goog.require('goog.Uri');
goog.require('goog.asserts');
goog.require('goog.async.DeferredList');
goog.require('goog.async.Delay');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.net.EventType');
goog.require('goog.object');
goog.require('goog.storage.Storage');
goog.require('goog.storage.mechanism.IterableMechanism');
goog.require('goog.storage.mechanism.Mechanism');
goog.require('goog.storage.mechanism.mechanismfactory');
goog.require('ol.array');
goog.require('os.alert.AlertEventTypes');
goog.require('os.array');
goog.require('os.config');
goog.require('os.config.namespace');
goog.require('os.config.storage.ISettingsStorage');
goog.require('os.config.storage.SettingsStorageLoader');
goog.require('os.config.storage.SettingsStorageRegistry');
goog.require('os.events.SettingChangeEvent');
goog.require('os.metrics.Metrics');
goog.require('os.net.Request');
goog.require('os.object');
goog.require('os.storage');
goog.require('os.xt.IMessageHandler');
goog.require('os.xt.Peer');


/**
 * @typedef {{
 *   namespace: string,
 *   keys: !Array<string>,
 *   newValue: *,
 *   oldValue: *
 * }}
 */
os.config.SettingsMessage;



/**
 * Maintains application settings which are retrieved from different storage sources,
 * (see {os.config.storage.SettingsStorageRegistry}), and merged to be accessible to the client.  Also handles
 * keeping the application current based on settings updates externally via crosstalk (xt).
 *
 * @extends {goog.events.EventTarget}
 * @implements {os.xt.IMessageHandler}
 * @constructor
 */
os.config.Settings = function() {
  os.config.Settings.base(this, 'constructor');

  this.storageRegistry_ = new os.config.storage.SettingsStorageRegistry();
  this.storageLoader_ = new os.config.storage.SettingsStorageLoader(this.storageRegistry_);

  /**
   * The merged version of the config that consumers of settings will use.
   * @type {!Object}
   * @private
   */
  this.mergedConfig_ = {};

  /**
   * The separated version of the config, used for keeping track of config and preferences separately
   * @type {!Object}
   * @private
   */
  this.actualConfig_ = {};
  this.actualConfig_[os.config.ConfigType.PREFERENCE] = {};
  this.actualConfig_[os.config.ConfigType.CONFIG] = {};

  /**
   * The config containing only the keys which have been changed since their last save.  All settings in this object
   * are user preferences, so don't separate them.
   * @type {!Object}
   * @private
   */
  this.deltaConfig_ = {};

  /**
   * If the settings instance has been initialized.
   * @type {boolean}
   * @private
   */
  this.initialized_ = false;

  /**
   * If the settings instance has finished loading.
   * @type {boolean}
   * @private
   */
  this.loaded_ = false;

  /**
   * Global flag for whether or not saving is currently enabled. When set to false, the application
   * will not save settings, either periodically or on close.
   * @type {boolean}
   * @private
   */
  this.persistenceEnabled_ = true;

  /**
   * Determine if the storage has changed.  This indicates that all keys should be saved instead of simply the deltas
   * @type {boolean}
   * @private
   */
  this.writeStorageChanged_ = false;

  /**
   * The timer for periodically saving the settings
   * @type {goog.Timer}
   * @private
   */
  this.periodicSaveTimer_ = new goog.Timer(60000);
  this.periodicSaveTimer_.listen(goog.Timer.TICK, function() {
    this.save();
  }, false, this);
  this.periodicSaveTimer_.start();

  /**
   * settings changed flag
   * @type {boolean}
   * @private
   */
  this.changed_ = false;

  /**
   * Queue of settings change messages to send as XT messages.
   * @type {Array<os.config.SettingsMessage>}
   * @private
   */
  this.toNotifyExternal_ = [];

  /**
   * Queue of settings change messages to send internally as events.
   * @type {Array<os.config.SettingsMessage>}
   * @private
   */
  this.toNotifyInternal_ = [];

  /**
   * Delay for debouncing reload calls.
   * @type {goog.async.Delay}
   * @private
   */
  this.reloadDelay_ = new goog.async.Delay(this.reload, 500, this);

  /**
   * Max number of storage failures allowed
   * for a storage provider.
   * @type {number}
   * @private
   */
  this.maxStorageFails_ = 10;

  /**
   * Tracks storage fails.
   * @type {Object}
   * @private
   */
  this.storageFails_ = {};

  /**
   * Reduces frequency of save calls after settings changes.
   * @type {goog.async.Delay}
   * @private
   */
  this.saveDelay_ = new goog.async.Delay(this.save, 500, this);

  /**
   * Peer for communicating settings changes among application instances
   * @type {?os.xt.Peer}
   * @private
   */
  this.peer_ = null;
};
goog.inherits(os.config.Settings, goog.events.EventTarget);
goog.addSingletonGetter(os.config.Settings);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.config.Settings.LOGGER_ = goog.log.getLogger('os.config.Settings');


/**
 * The settings key
 * @type {string}
 * @private
 */
os.config.Settings.KEY_ = 'settings';


/**
 * Key to hold the storage writeType.
 * @const {string}
 */
os.config.Settings.WRITE_STORAGE_KEY = 'storage.writeType';


/**
 * Key to save the write storage type to local storage as a backup in case other storages don't load properly.
 * @const {string}
 */
os.config.Settings.WRITE_STORAGE_BACKUP_KEY = 'opensphere.config.' + os.config.Settings.WRITE_STORAGE_KEY;


/**
 * Retrieve a reference to the registry of storage mechanisms to be manipulated directly
 *
 * @return {!os.config.storage.SettingsStorageRegistry}
 */
os.config.Settings.prototype.getStorageRegistry = function() {
  return this.storageRegistry_;
};


/**
 * Initializes the settings instance.
 */
os.config.Settings.prototype.init = function() {
  if (!this.initialized_) {
    goog.log.fine(os.config.Settings.LOGGER_, 'Initializing settings.');
    this.loaded_ = false;

    this.peer_ = new os.xt.Peer();
    this.peer_.setTitle(os.config.appNs + 'Settings');
    this.peer_.setGroup(os.config.Settings.KEY_);
    this.peer_.addHandler(this);

    this.storageLoader_.init().addBoth(this.onInit_, this);
  } else {
    goog.log.warning(os.config.Settings.LOGGER_, 'Settings already initialized!');
  }
};


/**
 * Handle registered storages initialization success
 *
 * @private
 */
os.config.Settings.prototype.onInit_ = function() {
  goog.log.fine(os.config.Settings.LOGGER_, 'Settings initialized.');
  this.initialized_ = true;
  this.dispatchEvent(new goog.events.Event(os.config.EventType.INITIALIZED));
};


/**
 * Check if settings has been initialized.
 *
 * @return {boolean} If settings has been initialized.
 */
os.config.Settings.prototype.isInitialized = function() {
  return this.initialized_;
};


/**
 * Check if settings has finished loading.
 *
 * @return {boolean} If settings has finished loading.
 */
os.config.Settings.prototype.isLoaded = function() {
  return this.loaded_;
};


/**
 * Get whether saving is enabled.
 *
 * @return {boolean}
 */
os.config.Settings.prototype.getPersistenceEnabled = function() {
  return this.persistenceEnabled_;
};


/**
 * Sets whether saving is enabled.
 *
 * @param {boolean} val
 */
os.config.Settings.prototype.setPersistenceEnabled = function(val) {
  this.persistenceEnabled_ = val;
};


/**
 * Loads settings from all registered storages, merge them into an accessible structure for client consumption, and
 * establish a suitable writable storage to for saves.
 */
os.config.Settings.prototype.load = function() {
  goog.log.fine(os.config.Settings.LOGGER_, 'Loading settings');
  this.loaded_ = false;
  this.storageLoader_.loadAll().addBoth(this.onLoad_, this);
};


/**
 * Reloads settings from storage. This is performed after receiving a change message over XT.
 */
os.config.Settings.prototype.reload = function() {
  goog.log.fine(os.config.Settings.LOGGER_, 'Reloading settings');
  this.storageLoader_.loadAll().addBoth(this.onReload_, this);
};


/**
 * Handler for settings reload. Purges the current settings, reloads the new ones, and fires internal notification
 * events to update anything in the app that might care.
 *
 * @param {Object} config
 * @private
 */
os.config.Settings.prototype.onReload_ = function(config) {
  // empty the existing configs as they are being replaced
  this.mergedConfig_ = {};
  this.actualConfig_ = {};

  // recreate the fresh new config
  this.onLoad_(config);

  // notify this app that settings have been reloaded
  for (var i = 0, ii = this.toNotifyInternal_.length; i < ii; i++) {
    var item = this.toNotifyInternal_[i];
    this.dispatchChange_(item.keys, this.get(item.keys), item.oldValue, true);
  }

  this.toNotifyInternal_ = [];
  this.dispatchEvent(new goog.events.Event(os.config.EventType.RELOADED));
};


/**
 * Handles successful load of all settings
 *
 * @param {Object} loadedConfig
 * @private
 */
os.config.Settings.prototype.onLoad_ = function(loadedConfig) {
  goog.log.fine(os.config.Settings.LOGGER_, 'Settings loaded');
  if (loadedConfig) {
    this.actualConfig_ = loadedConfig;

    if (goog.object.containsKey(loadedConfig, os.config.ConfigType.PREFERENCE)) {
      var pref = os.config.namespace.removeNamespaces(loadedConfig[os.config.ConfigType.PREFERENCE]);
      os.object.merge(pref, this.mergedConfig_);
    }
    if (goog.object.containsKey(loadedConfig, os.config.ConfigType.CONFIG)) {
      var conf = loadedConfig[os.config.ConfigType.CONFIG];
      os.object.merge(conf, this.mergedConfig_);
    }

    this.actualConfig_[os.config.ConfigType.PREFERENCE] = os.config.namespace.removeObsoleteKeys(
        this.actualConfig_[os.config.ConfigType.PREFERENCE]);
  }

  this.finalizeLoadSettings_();
};


/**
 * Finish the settings load
 *
 * @private
 */
os.config.Settings.prototype.finalizeLoadSettings_ = function() {
  // verify every registered storage loaded properly, if not then continue but with warning
  var allLoaded = true;
  for (var i = 0, ii = this.storageRegistry_.getNumberOfStorages(); i < ii; i++) {
    var storage = this.storageRegistry_.getStorageAt(i);
    var canAccess = storage.canAccess;
    allLoaded = allLoaded && canAccess;
    if (!canAccess) {
      goog.log.error(os.config.Settings.LOGGER_, 'Settings failed to load from ' + storage.name);
    }
  }
  if (!allLoaded) {
    this.alertOneFailed_();
  }

  // prepare storages for save
  var type = goog.object.getValueByKeys(this.mergedConfig_, ['storage', 'writeType']) ||
      os.config.storage.SettingsWritableStorageType.LOCAL;

  this.initialized_ = true;
  this.loaded_ = true;

  // This must be called after setting this.loaded_ to true
  this.setWriteStorageType(/** @type {os.config.storage.SettingsWritableStorageType} */ (type));

  this.peer_.init();
  goog.log.info(os.config.Settings.LOGGER_, 'Settings finished loading');
  this.dispatchEvent(new goog.events.Event(os.config.EventType.LOADED));
};


/**
 * Get the settings
 *
 * @param {boolean=} opt_onlyPrefs get only user prefs
 * @return {Object}
 */
os.config.Settings.prototype.getSettingsConfig = function(opt_onlyPrefs) {
  return opt_onlyPrefs ? this.actualConfig_[os.config.ConfigType.PREFERENCE] : this.mergedConfig_;
};


/**
 * Change the type of storage to use to save settings.
 *
 * @param {os.config.storage.SettingsWritableStorageType} type
 * @param {boolean=} opt_alert Send a notification on the UI to confirm the update successfully occurred.
 */
os.config.Settings.prototype.setWriteStorageType = function(type, opt_alert) {
  this.writeStorageChanged_ = true;

  var success = this.storageRegistry_.setWriteStorageType(type);
  if (success) {
    goog.log.fine(os.config.Settings.LOGGER_, 'Updated setting write type to ' + type);
    this.persistenceEnabled_ = true;
    if (opt_alert) {
      this.alertTypeChange_();
    }
  } else {
    goog.log.error(os.config.Settings.LOGGER_, 'Updated setting write type to \'' + type + '\', but there was no ' +
        'accessible, registered storage to match.  Peristence will be disabled.');
    this.alertFailure_(10);
    this.fail_('Failed to save settings to the configured storage type');
  }

  var storage = this.getStorageRegistry().getWriteStorage();
  var storageName = storage ? storage.name : 'not assigned';
  goog.log.info(os.config.Settings.LOGGER_, 'Storage write location is now: ' + storageName);

  this.set(os.config.Settings.WRITE_STORAGE_KEY, type, !opt_alert);
  window.localStorage.setItem(os.config.Settings.WRITE_STORAGE_BACKUP_KEY, type);
};


/**
 * Saves the settings if saving is enabled.
 *
 * @param {Object=} opt_settingsToOverwrite
 * @return {!goog.Promise}
 */
os.config.Settings.prototype.save = function(opt_settingsToOverwrite) {
  // stop the delay in case this was called manually
  if (this.saveDelay_) {
    this.saveDelay_.stop();
  }

  if (this.persistenceEnabled_ && this.loaded_ && this.changed_) {
    this.changed_ = false;

    var storage = this.storageRegistry_.getWriteStorage();
    if (storage) {
      this.dispatchEvent(new goog.events.Event(os.config.EventType.WILL_SAVE));

      // only write user preferences
      var userPref = this.actualConfig_[os.config.ConfigType.PREFERENCE];
      os.config.namespace.removeObsoleteKeys(userPref);
      // only write user preferences, only write the minimum of what the storage needs to insert changed values
      var userPrefsToPersist = (!this.writeStorageChanged_ && storage.canInsertDeltas) ? this.deltaConfig_ : userPref;

      // clear the delta config
      this.deltaConfig_ = {};

      goog.log.fine(os.config.Settings.LOGGER_, 'Saving settings...');

      var keysToDelete = goog.array.clone(os.config.namespace.getObsoleteKeys());
      goog.array.insertArrayAt(keysToDelete, os.config.namespace.keysToDelete.slice());

      if (opt_settingsToOverwrite != null) {
        userPrefsToPersist = opt_settingsToOverwrite;
      }

      // return a promise that is resolved when settings have been saved, or rejected on error.
      return new goog.Promise(function(resolve, reject) {
        storage.setSettings(userPrefsToPersist, keysToDelete).addCallbacks(function() {
          this.onSaveSuccess_();
          resolve();
        }, function(opt_error) {
          this.onSaveError_(opt_error);
          reject(opt_error);
        }, this);
      }, this);
    } else if (!this.persistenceEnabled_) {
      // persistence was disabled, so report the error and return a rejected promise
      this.fail_();

      var errorMsg = 'Settings could not be saved, no accessible, writable storage was found in the registry.';
      goog.log.warning(os.config.Settings.LOGGER_, errorMsg);
      this.dispatchEvent(new goog.events.Event(os.config.EventType.SAVED));

      return goog.Promise.reject(errorMsg);
    }
  }

  // any other path should resolve immediately
  return goog.Promise.resolve();
};


/**
 * Handle settings successfully saved to async service
 *
 * @private
 */
os.config.Settings.prototype.onSaveSuccess_ = function() {
  goog.log.fine(os.config.Settings.LOGGER_, 'Settings saved');
  this.writeStorageChanged_ = false;
  os.config.namespace.keysToDelete.length = 0;
  os.config.namespace.clearObsoleteKeys();
  var type = this.storageRegistry_.getWriteStorageType();
  if (type) {
    this.incrementStorageFail_(type, true);
  }

  // fire off XT messages for every item in the external queue
  for (var i = 0, ii = this.toNotifyExternal_.length; i < ii; i++) {
    var item = this.toNotifyExternal_[i];
    this.peer_.send(item.namespace, item);
  }

  this.toNotifyExternal_ = [];
  this.clearOthers_();
};


/**
 * @param {string=} opt_error
 * @private
 */
os.config.Settings.prototype.onSaveError_ = function(opt_error) {
  var storage = this.storageRegistry_.getWriteStorage();
  var type = this.storageRegistry_.getWriteStorageType();
  goog.log.error(os.config.Settings.LOGGER_, 'Failed to save settings to ' + storage.name +
      '.  Attempting to find another suitable storage of type ' + type);
  // reset the changed sate
  this.changed_ = true;
  // increment fail counter for type
  this.incrementStorageFail_(type);
  // mark current write storage as bad if attempts exceeds max fails allowed.
  storage.canAccess = (this.storageFails_[type] < this.maxStorageFails_);
  // try to set an appropriate storage again of the same type
  this.setWriteStorageType(type);
};


/**
 * Increments the storage failure count for type.
 *
 * @param {string} type
 * @param {boolean=} opt_restart reset the storgage fail counter for type.
 * @private
 */
os.config.Settings.prototype.incrementStorageFail_ = function(type, opt_restart) {
  if (this.storageFails_.hasOwnProperty(type)) {
    this.storageFails_[type] = opt_restart ? 0 : (this.storageFails_[type] + 1);
  } else {
    this.storageFails_[type] = 0;
  }
};


/**
 * Clear all the writable settings that are not currently in use.
 *
 * @private
 */
os.config.Settings.prototype.clearOthers_ = function() {
  var storagesToClear = this.storageRegistry_.getStoragesToClear();
  if (storagesToClear.length) {
    var deferreds = [];
    storagesToClear.forEach(function(storageToClear) {
      goog.log.fine(os.config.Settings.LOGGER_, 'Clearing settings from ' + storageToClear.name +
          ' since it is not the designated write storage and all settings have been merged.');
      deferreds.push(storageToClear.deleteSettings(os.config.coreNs));
      deferreds.push(storageToClear.deleteSettings(os.config.appNs));
      storageToClear.needsCleared = false;
    }, this);

    new goog.async.DeferredList(deferreds).addBoth(this.onClearedOthers_, this);
  }
};


/**
 * Handle all other settings deleted
 *
 * @param {!Array<!Array>} deferredListResults
 * @private
 */
os.config.Settings.prototype.onClearedOthers_ = function(deferredListResults) {
  var success = goog.array.every(deferredListResults, function(deferredListResult) {
    return deferredListResult[0];
  }, this);

  if (!success) {
    goog.log.warning(os.config.Settings.LOGGER_,
        'Failed to clear one or more of the setting storages after switching write location. ' +
        'If this storage becomes accessible in the future, the remnant settings may affect application preferences ' +
        'since they will be merged with the others upon session initialization.');
  }

  this.dispatchEvent(new goog.events.Event(os.config.EventType.SAVED));
};


/**
 * Sends an updated event
 */
os.config.Settings.prototype.update = function() {
  goog.log.fine(os.config.Settings.LOGGER_, 'Settings updated');
  this.dispatchEvent(new goog.events.Event(os.config.EventType.UPDATED));
};


/**
 * Remove all keys and values from the storage.  Calling this function will wipe out settings for this application in
 * the settings service as well.  Use wisely.
 *
 * @param {string=} opt_namespace
 * @return {!goog.Promise}
 */
os.config.Settings.prototype.reset = function(opt_namespace) {
  var namespace = opt_namespace || os.config.appNs;
  goog.log.info(os.config.Settings.LOGGER_, 'Resetting settings for the application namespace: ' + namespace);

  return new goog.Promise(function(resolve, reject) {
    // get the current storage type. this shouldn't be changed by the reset, so we'll restore it later.
    var type = this.get(os.config.Settings.WRITE_STORAGE_KEY,
        window.localStorage.getItem(os.config.Settings.WRITE_STORAGE_BACKUP_KEY) ||
        os.config.storage.SettingsWritableStorageType.LOCAL);

    var storage = this.storageRegistry_.getWriteStorage();
    if (storage) {
      goog.Promise.all([storage.deleteSettings(os.config.coreNs),
        storage.deleteSettings(namespace)]).then(function() {
        goog.log.fine(os.config.Settings.LOGGER_, 'Reset settings success');

        // clear the user config section then save the storage type back to it
        this.actualConfig_[os.config.ConfigType.PREFERENCE] = {};
        if (type === os.config.storage.SettingsWritableStorageType.REMOTE &&
            !this.storageRegistry_.hasRemoteStorage) {
          this.set(os.config.Settings.WRITE_STORAGE_KEY, os.config.storage.SettingsWritableStorageType.LOCAL, true);
        } else {
          os.object.delete(this.mergedConfig_, ['storage', 'writeType']);
          this.set(os.config.Settings.WRITE_STORAGE_KEY, type, true);
        }

        // set a metric for settings.reset
        os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Settings.RESET_SETTINGS, 1);
        // publish all metrics immediately
        os.metrics.Metrics.getInstance().publish();

        // save the most recent reset date and time in local storage
        var currentApp = namespace;
        localStorage.setItem('resetDate', currentApp + ' ' + new Date().toISOString());
        // save current date time in settings
        this.set('reset.last', Date());

        // save settings before resolving or rejecting the promise
        this.save().then(resolve, reject);
      }, function(opt_reason) {
        // delete failed, so log the error and reject the promise
        var errorMsg = 'Reset settings failed' + (opt_reason ? (': ' + opt_reason) : '');
        goog.log.error(os.config.Settings.LOGGER_, errorMsg);
        reject(errorMsg);
      }, this);
    } else {
      reject('Write storage not available.');
    }
  }, this);
};

/**
 * Retrieve the last reset date for the current application if defined
 *
 * @return {string}
 */
os.config.Settings.prototype.getLastReset = function() {
  try {
    var resetDate = new Date(this.actualConfig_[os.config.ConfigType.PREFERENCE][os.config.appNs]['reset']['last'])
        .toISOString().replace(/T/, ' ').replace(/(.000)/, ' ');
  } catch (TypeError) {
    var resetDate = 'Never!';
  }
  return resetDate;
};


/**
 * Retrieve the settings' peer info objects
 *
 * @param {string=} opt_type The optional message type.
 * @return {Array<os.xt.PeerInfo>}
 */
os.config.Settings.prototype.getPeerInfo = function(opt_type) {
  return this.peer_ ? this.peer_.getPeerInfo(opt_type) : null;
};


/**
 * Get a COPY of a config value multiple levels deep.
 *
 * @param {!(Array<number|string>|string)} keys A period-delimited string of keys (ie, one.two.three), or an array of
 *                                              keys (as strings, or numbers, for array-like objects).
 * @param {*=} opt_default Default value
 * @return {*} The resulting value, or the default value if not found.
 */
os.config.Settings.prototype.get = function(keys, opt_default) {
  if (typeof keys == 'string') {
    keys = keys.split('.');
  }

  if (this.loaded_) {
    var val = goog.object.getValueByKeys(this.mergedConfig_, keys);
    if (goog.isArray(val)) {
      val = goog.array.clone(val);
    } else if (goog.isObject(val)) {
      val = goog.object.clone(val);
    }

    return val !== undefined ? val : opt_default;
  } else {
    throw new Error('Attempted to get a value before settings were loaded!');
  }
};


/**
 * Set a config value multiple levels deep.
 *
 * @param {!(Array<number|string>|string)} keys A period-delimited string of keys (ie, one.two.three), or an array of
 *   keys (as strings, or numbers, for array-like objects).
 * @param {?} value
 * @param {boolean=} opt_localOnly Process the value internally but don't persist it or communicate it.  Used to
 *   update the local instance with an already established value, like when processing an XT message or unit test; or
 *   to bypass the throttled save.
 *
 * @export Prevent the compiler from moving the function off the prototype
 */
os.config.Settings.prototype.set = function(keys, value, opt_localOnly) {
  if (this.loaded_) {
    if (typeof keys == 'string') {
      keys = keys.split('.');
    }

    var oldVal = this.get(keys);

    if (this.isExternal_(value)) {
      // clone externally created objects/arrays to prevent a leak when the external context is closed
      value = os.object.unsafeClone(value);
    }

    os.object.set(this.mergedConfig_, keys, value);

    var isAdminKey = this.isAdmin_(keys);
    var namespacedKeys = [];

    if (!isAdminKey) {
      namespacedKeys = os.config.namespace.getPrefixedKeys(keys);
      os.object.set(this.actualConfig_[os.config.ConfigType.PREFERENCE], namespacedKeys, value);
    }

    if (oldVal != value) {
      if (!isAdminKey) {
        os.object.set(this.deltaConfig_, namespacedKeys, value);
        this.markKeysForDelete_(keys, value, oldVal);
      }

      this.dispatchChange_(keys, value, oldVal, opt_localOnly);
    }
  } else {
    throw new Error('Attempted to set a value before settings were loaded!');
  }
};


/**
 * We have to explicitly delete keys instead of simply removing the value from config.  This function handles
 * making that change so clients don't have to handle the details.
 *
 * @param {!Array<!string>|!string} keys
 */
os.config.Settings.prototype.delete = function(keys) {
  if (typeof keys == 'string') {
    keys = keys.split('.');
  }

  var oldVal = this.get(keys);

  os.object.delete(this.mergedConfig_, keys);

  var namespacedKeys = os.config.namespace.getPrefixedKeys(keys);
  os.object.delete(this.actualConfig_[os.config.ConfigType.PREFERENCE], namespacedKeys);

  if (goog.typeOf(oldVal) === 'object') {
    // delete elements of a deeply nested object
    this.markKeysForDelete_(keys, undefined, oldVal);
  } else {
    // delete the key entirely
    goog.array.insert(os.config.namespace.keysToDelete, os.config.namespace.getPrefixedKey(keys.join('.')));
  }

  this.dispatchChange_(keys, undefined, oldVal);
};


/**
 * Dispatch change event, optionally also send notification over XT
 *
 * @param {!Array<!string|!number>} keys
 * @param {*} newVal
 * @param {*} oldVal
 * @param {boolean=} opt_localOnly
 * @private
 */
os.config.Settings.prototype.dispatchChange_ = function(keys, newVal, oldVal, opt_localOnly) {
  var joined = keys.join('.');
  this.dispatchEvent(new os.events.SettingChangeEvent(joined, newVal, oldVal));

  if (!opt_localOnly) {
    this.changed_ = true;
    var namespacedKeys = os.config.namespace.getPrefixedKeys(keys);

    if (joined == os.config.Settings.WRITE_STORAGE_KEY) {
      this.peer_.send(namespacedKeys[0], {keys: keys, newValue: newVal});
    } else {
      goog.array.insert(this.toNotifyExternal_, {namespace: namespacedKeys[0], keys: keys});
    }

    if (this.saveDelay_) {
      this.saveDelay_.start();
    }
  }
};


/**
 * Determine if the keys are admin keys
 *
 * @param {!Array<!string|!number>} keys
 * @return {boolean}
 * @private
 */
os.config.Settings.prototype.isAdmin_ = function(keys) {
  return goog.object.getValueByKeys(this.actualConfig_[os.config.ConfigType.CONFIG], keys) !== undefined;
};


/**
 * Compare a new value to an old value to determine if any keys need to be deleted.  Some storage solutions need to
 * delete keys directly (they can only insert new values, not overwite), so we must be aware of what the deltas are
 * and explicitly delete the missing keys.
 *
 * @param {!Array<number|string>} keys array of keys (as strings, or numbers, for array-like objects).
 * @param {*} newVal
 * @param {*} oldVal
 * @private
 */
os.config.Settings.prototype.markKeysForDelete_ = function(keys, newVal, oldVal) {
  if (goog.typeOf(oldVal) === 'object') {
    var oldObjKeys = goog.object.getKeys(os.object.reduce(oldVal));
    var newObjKeys = newVal != null ? goog.object.getKeys(os.object.reduce(newVal)) : [];
    var keysAsStr = keys.join('.');
    os.array.forEach(oldObjKeys, function(oldObjKey) {
      if (!ol.array.includes(newObjKeys, oldObjKey)) {
        goog.array.insert(os.config.namespace.keysToDelete, os.config.namespace.getPrefixedKey(keysAsStr + '.' +
            oldObjKey));
      }
    });
  }
};


/**
 * Test if a value was created in an external window context. This only matters for objects and arrays, which will cause
 * a leak if we keep a reference and the external window is closed.
 *
 * @param {?} value The value
 * @return {boolean} If the value should be cloned.
 * @private
 */
os.config.Settings.prototype.isExternal_ = function(value) {
  return !(value instanceof Object || value instanceof Array) && typeof value === 'object';
};


/**
 * Handle failed communication with user settings.  Disable persistence. This should place the
 * application in an "offline" mode, where any settings from this session are not remembered.
 *
 * @param {string=} opt_error Error or message
 * @private
 */
os.config.Settings.prototype.fail_ = function(opt_error) {
  var e = opt_error || 'Failed to connect to user settings';
  goog.log.error(os.config.Settings.LOGGER_, e);
  this.persistenceEnabled_ = false;
};


/**
 * Send an applicaiton alert that settings failed
 *
 * @param {number=} opt_delay
 * @private
 */
os.config.Settings.prototype.alertFailure_ = function(opt_delay) {
  // {@todo is there a better way to fire alert before alert directive is ready than settimeout?}
  setTimeout(goog.bind(function() {
    var dismissAlertEventTarget = new goog.events.EventTarget();
    var dismissAlert = function() {
      dismissAlertEventTarget.dispatchEvent(new goog.events.Event(os.alert.AlertEventTypes.DISMISS_ALERT));
    };
    this.listenOnce(os.config.Settings.WRITE_STORAGE_KEY, dismissAlert, false, this);
    var alertMgr = os.alert.AlertManager.getInstance();
    alertMgr.sendAlert('<strong>Settings are unavailable!</strong> This session will continue to run without any ' +
        'previously saved options, and any changes you make will not be remembered for the next session.',
    os.alert.AlertEventSeverity.ERROR, undefined, 1, dismissAlertEventTarget);
  }, this), opt_delay || 2500);
};


/**
 * @param {number=} opt_delay
 * @private
 */
os.config.Settings.prototype.alertOneFailed_ = function(opt_delay) {
  var alertMgr = os.alert.AlertManager.getInstance();
  alertMgr.sendAlert('Settings failed to load from one or more sources.  This session will continue to run, but ' +
      'you may notice some of your previously saved preferences are not available.',
  os.alert.AlertEventSeverity.WARNING);
};


/**
 * Send an application alert to confirm that the settings storage has been updated.
 *
 * @private
 */
os.config.Settings.prototype.alertTypeChange_ = function() {
  var type = this.storageRegistry_.getWriteStorageType();
  var alertMgr = os.alert.AlertManager.getInstance();
  var msg = 'Success!  Your settings are now being saved ';
  switch (type) {
    case os.config.storage.SettingsWritableStorageType.LOCAL:
      msg += 'locally.  Your preferences will remain tied to your current work station.';
      break;
    case os.config.storage.SettingsWritableStorageType.REMOTE:
      msg += 'to the server.  Your preferences will follow you as you move to different locations.';
      break;
    default:
      break;
  }

  alertMgr.sendAlert(msg, os.alert.AlertEventSeverity.INFO);
};


/**
 * @inheritDoc
 * @see {os.xt.IMessageHandler}
 */
os.config.Settings.prototype.getTypes = function() {
  return [os.config.coreNs, os.config.appNs];
};


/**
 * @inheritDoc
 * @see {os.xt.IMessageHandler}
 */
os.config.Settings.prototype.process = function(data, type, sender, time) {
  var settingsMessage = /** @type {os.config.SettingsMessage} */ (data);
  if (settingsMessage.keys && settingsMessage.keys.join('.') === os.config.Settings.WRITE_STORAGE_KEY) {
    this.setWriteStorageType(
        /** @type {os.config.storage.SettingsWritableStorageType} */ (settingsMessage.newValue));
  } else {
    // save off the current value on the message and queue it for processing after the reload
    settingsMessage.oldValue = this.get(settingsMessage.keys);
    this.toNotifyInternal_.push(settingsMessage);
  }
  this.reloadDelay_.start();
};


/**
 * Global data manager reference. Set this in each application with the app-specific manager reference.
 * @type {!os.config.Settings}
 */
os.settings = os.config.Settings.getInstance();

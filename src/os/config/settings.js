goog.declareModuleId('os.config.Settings');

import AlertEventSeverity from '../alert/alerteventseverity.js';
import AlertEventTypes from '../alert/alerteventtypes.js';
import AlertManager from '../alert/alertmanager.js';
import SettingChangeEvent from '../events/settingchangeevent.js';
import Metrics from '../metrics/metrics.js';
import {Settings as SettingsMetrics} from '../metrics/metricskeys.js';
import * as osObject from '../object/object.js';
import * as os from '../os.js';
import Peer from '../xt/peer.js';
import {appNs, coreNs} from './config.js';
import {getSettings, setSettings} from './configinstance.js';
import ConfigType from './configtype.js';
import ConfigEventType from './eventtype.js';
import * as osConfigNamespace from './namespace.js';
import SettingsStorageLoader from './storage/settingsstorageloader.js';
import SettingsStorageRegistry from './storage/settingsstorageregistry.js';
import SettingsWritableStorageType from './storage/settingswritablestoragetype.js';

const Promise = goog.require('goog.Promise');
const Timer = goog.require('goog.Timer');
const googArray = goog.require('goog.array');
const DeferredList = goog.require('goog.async.DeferredList');
const Delay = goog.require('goog.async.Delay');
const GoogEvent = goog.require('goog.events.Event');
const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const googObject = goog.require('goog.object');

const {default: IMessageHandler} = goog.requireType('os.xt.IMessageHandler');
const {default: PeerInfo} = goog.requireType('os.xt.PeerInfo');


/**
 * @typedef {{
 *   namespace: string,
 *   keys: !Array<string>,
 *   newValue: *,
 *   oldValue: *
 * }}
 */
let SettingsMessage;


/**
 * Maintains application settings which are retrieved from different storage sources,
 * (see {SettingsStorageRegistry}), and merged to be accessible to the client.  Also handles
 * keeping the application current based on settings updates externally via crosstalk (xt).
 *
 * @implements {IMessageHandler}
 */
export default class Settings extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.storageRegistry_ = new SettingsStorageRegistry();
    this.storageLoader_ = new SettingsStorageLoader(this.storageRegistry_);

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
    this.actualConfig_[ConfigType.PREFERENCE] = {};
    this.actualConfig_[ConfigType.CONFIG] = {};

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
     * @type {Timer}
     * @private
     */
    this.periodicSaveTimer_ = new Timer(60000);
    this.periodicSaveTimer_.listen(Timer.TICK, () => {
      this.save();
    }, false);
    this.periodicSaveTimer_.start();

    /**
     * settings changed flag
     * @type {boolean}
     * @private
     */
    this.changed_ = false;

    /**
     * Queue of settings change messages to send as XT messages.
     * @type {Array<SettingsMessage>}
     * @private
     */
    this.toNotifyExternal_ = [];

    /**
     * Queue of settings change messages to send internally as events.
     * @type {Array<SettingsMessage>}
     * @private
     */
    this.toNotifyInternal_ = [];

    /**
     * Delay for debouncing reload calls.
     * @type {Delay}
     * @private
     */
    this.reloadDelay_ = new Delay(this.reload, 500, this);

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
     * @type {Delay}
     * @private
     */
    this.saveDelay_ = new Delay(this.save, 500, this);

    /**
     * Peer for communicating settings changes among application instances
     * @type {?Peer}
     * @private
     */
    this.peer_ = null;
  }

  /**
   * Retrieve a reference to the registry of storage mechanisms to be manipulated directly
   *
   * @return {!SettingsStorageRegistry}
   */
  getStorageRegistry() {
    return this.storageRegistry_;
  }

  /**
   * Initializes the settings instance.
   */
  init() {
    if (!this.initialized_) {
      log.fine(logger, 'Initializing settings.');
      this.loaded_ = false;

      this.peer_ = new Peer();
      this.peer_.setTitle(appNs + 'Settings');
      this.peer_.setGroup(settingsKey);
      this.peer_.addHandler(this);

      this.storageLoader_.init().addBoth(this.onInit_, this);
    } else {
      log.warning(logger, 'Settings already initialized!');
    }
  }

  /**
   * Handle registered storages initialization success
   *
   * @private
   */
  onInit_() {
    log.fine(logger, 'Settings initialized.');
    this.initialized_ = true;
    this.dispatchEvent(new GoogEvent(ConfigEventType.INITIALIZED));
  }

  /**
   * Check if settings has been initialized.
   *
   * @return {boolean} If settings has been initialized.
   */
  isInitialized() {
    return this.initialized_;
  }

  /**
   * Check if settings has finished loading.
   *
   * @return {boolean} If settings has finished loading.
   */
  isLoaded() {
    return this.loaded_;
  }

  /**
   * Get whether saving is enabled.
   *
   * @return {boolean}
   */
  getPersistenceEnabled() {
    return this.persistenceEnabled_;
  }

  /**
   * Sets whether saving is enabled.
   *
   * @param {boolean} val
   */
  setPersistenceEnabled(val) {
    this.persistenceEnabled_ = val;
  }

  /**
   * Loads settings from all registered storages, merge them into an accessible structure for client consumption, and
   * establish a suitable writable storage to for saves.
   */
  load() {
    log.fine(logger, 'Loading settings');
    this.loaded_ = false;
    this.storageLoader_.loadAll().addBoth(this.onLoad_, this);
  }

  /**
   * Reloads settings from storage. This is performed after receiving a change message over XT.
   */
  reload() {
    log.fine(logger, 'Reloading settings');
    this.storageLoader_.loadAll().addBoth(this.onReload_, this);
  }

  /**
   * Handler for settings reload. Purges the current settings, reloads the new ones, and fires internal notification
   * events to update anything in the app that might care.
   *
   * @param {Object} config
   * @private
   */
  onReload_(config) {
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
    this.dispatchEvent(new GoogEvent(ConfigEventType.RELOADED));
  }

  /**
   * Handles successful load of all settings
   *
   * @param {Object} loadedConfig
   * @private
   */
  onLoad_(loadedConfig) {
    log.fine(logger, 'Settings loaded');
    if (loadedConfig) {
      this.actualConfig_ = loadedConfig;

      if (googObject.containsKey(loadedConfig, ConfigType.PREFERENCE)) {
        var pref = osConfigNamespace.removeNamespaces(loadedConfig[ConfigType.PREFERENCE]);
        osObject.merge(pref, this.mergedConfig_);
      }
      if (googObject.containsKey(loadedConfig, ConfigType.CONFIG)) {
        var conf = loadedConfig[ConfigType.CONFIG];
        osObject.merge(conf, this.mergedConfig_);
      }

      this.actualConfig_[ConfigType.PREFERENCE] = osConfigNamespace.removeObsoleteKeys(
          this.actualConfig_[ConfigType.PREFERENCE]);
    }

    this.finalizeLoadSettings_();
  }

  /**
   * Finish the settings load
   *
   * @private
   */
  finalizeLoadSettings_() {
    // verify every registered storage loaded properly, if not then continue but with warning
    var allLoaded = true;
    for (var i = 0, ii = this.storageRegistry_.getNumberOfStorages(); i < ii; i++) {
      var storage = this.storageRegistry_.getStorageAt(i);
      var canAccess = storage.canAccess;
      allLoaded = allLoaded && canAccess;
      if (!canAccess) {
        log.error(logger, 'Settings failed to load from ' + storage.name);
      }
    }
    if (!allLoaded) {
      this.alertOneFailed_();
    }

    // prepare storages for save
    var type = googObject.getValueByKeys(this.mergedConfig_, ['storage', 'writeType']) ||
        SettingsWritableStorageType.LOCAL;

    this.initialized_ = true;
    this.loaded_ = true;

    // This must be called after setting this.loaded_ to true
    this.setWriteStorageType(/** @type {SettingsWritableStorageType} */ (type));

    this.peer_.init();
    log.info(logger, 'Settings finished loading');
    this.dispatchEvent(new GoogEvent(ConfigEventType.LOADED));
  }

  /**
   * Get the settings
   *
   * @param {boolean=} opt_onlyPrefs get only user prefs
   * @return {Object}
   */
  getSettingsConfig(opt_onlyPrefs) {
    return opt_onlyPrefs ? this.actualConfig_[ConfigType.PREFERENCE] : this.mergedConfig_;
  }

  /**
   * Change the type of storage to use to save settings.
   *
   * @param {SettingsWritableStorageType} type
   * @param {boolean=} opt_alert Send a notification on the UI to confirm the update successfully occurred.
   */
  setWriteStorageType(type, opt_alert) {
    this.writeStorageChanged_ = true;

    var success = this.storageRegistry_.setWriteStorageType(type);
    if (success) {
      log.fine(logger, 'Updated setting write type to ' + type);
      this.persistenceEnabled_ = true;
      if (opt_alert) {
        this.alertTypeChange_();
      }
    } else {
      log.error(logger, 'Updated setting write type to \'' + type + '\', but there was no ' +
          'accessible, registered storage to match.  Peristence will be disabled.');
      this.alertFailure_(10);
      this.fail_('Failed to save settings to the configured storage type');
    }

    var storage = this.getStorageRegistry().getWriteStorage();
    var storageName = storage ? storage.name : 'not assigned';
    log.info(logger, 'Storage write location is now: ' + storageName);

    this.set(Settings.WRITE_STORAGE_KEY, type, !opt_alert);
    window.localStorage.setItem(Settings.WRITE_STORAGE_BACKUP_KEY, type);
  }

  /**
   * Saves the settings if saving is enabled.
   *
   * @param {Object=} opt_settingsToOverwrite
   * @return {!Promise}
   */
  save(opt_settingsToOverwrite) {
    // stop the delay in case this was called manually
    if (this.saveDelay_) {
      this.saveDelay_.stop();
    }

    if (this.persistenceEnabled_ && this.loaded_ && this.changed_) {
      this.changed_ = false;

      var storage = this.storageRegistry_.getWriteStorage();
      if (storage) {
        this.dispatchEvent(new GoogEvent(ConfigEventType.WILL_SAVE));

        // only write user preferences
        var userPref = this.actualConfig_[ConfigType.PREFERENCE];
        osConfigNamespace.removeObsoleteKeys(userPref);
        // only write user preferences, only write the minimum of what the storage needs to insert changed values
        var userPrefsToPersist = (!this.writeStorageChanged_ && storage.canInsertDeltas) ? this.deltaConfig_ : userPref;

        // clear the delta config
        this.deltaConfig_ = {};

        log.fine(logger, 'Saving settings...');

        var keysToDelete = googArray.clone(osConfigNamespace.getObsoleteKeys());
        googArray.insertArrayAt(keysToDelete, osConfigNamespace.keysToDelete.slice());

        if (opt_settingsToOverwrite != null) {
          userPrefsToPersist = opt_settingsToOverwrite;
        }

        // return a promise that is resolved when settings have been saved, or rejected on error.
        return new Promise((resolve, reject) => {
          storage.setSettings(userPrefsToPersist, keysToDelete).addCallbacks(() => {
            this.onSaveSuccess_();
            resolve();
          }, (opt_error) => {
            this.onSaveError_(opt_error);
            reject(opt_error);
          });
        });
      } else if (!this.persistenceEnabled_) {
        // persistence was disabled, so report the error and return a rejected promise
        this.fail_();

        var errorMsg = 'Settings could not be saved, no accessible, writable storage was found in the registry.';
        log.warning(logger, errorMsg);
        this.dispatchEvent(new GoogEvent(ConfigEventType.SAVED));

        return Promise.reject(errorMsg);
      }
    }

    // any other path should resolve immediately
    return Promise.resolve();
  }

  /**
   * Handle settings successfully saved to async service
   *
   * @private
   */
  onSaveSuccess_() {
    log.fine(logger, 'Settings saved');
    this.writeStorageChanged_ = false;
    osConfigNamespace.keysToDelete.length = 0;
    osConfigNamespace.clearObsoleteKeys();
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
  }

  /**
   * @param {string=} opt_error
   * @private
   */
  onSaveError_(opt_error) {
    var storage = this.storageRegistry_.getWriteStorage();
    var type = this.storageRegistry_.getWriteStorageType();
    log.error(logger, 'Failed to save settings to ' + storage.name +
        '.  Attempting to find another suitable storage of type ' + type);
    // reset the changed sate
    this.changed_ = true;
    // increment fail counter for type
    this.incrementStorageFail_(type);
    // mark current write storage as bad if attempts exceeds max fails allowed.
    storage.canAccess = (this.storageFails_[type] < this.maxStorageFails_);
    // try to set an appropriate storage again of the same type
    this.setWriteStorageType(type);
  }

  /**
   * Increments the storage failure count for type.
   *
   * @param {string} type
   * @param {boolean=} opt_restart reset the storgage fail counter for type.
   * @private
   */
  incrementStorageFail_(type, opt_restart) {
    if (this.storageFails_.hasOwnProperty(type)) {
      this.storageFails_[type] = opt_restart ? 0 : (this.storageFails_[type] + 1);
    } else {
      this.storageFails_[type] = 0;
    }
  }

  /**
   * Clear all the writable settings that are not currently in use.
   *
   * @private
   */
  clearOthers_() {
    var storagesToClear = this.storageRegistry_.getStoragesToClear();
    if (storagesToClear.length) {
      var deferreds = [];
      storagesToClear.forEach(function(storageToClear) {
        log.fine(logger, 'Clearing settings from ' + storageToClear.name +
            ' since it is not the designated write storage and all settings have been merged.');
        deferreds.push(storageToClear.deleteSettings(coreNs));
        deferreds.push(storageToClear.deleteSettings(appNs));
        storageToClear.needsCleared = false;
      }, this);

      new DeferredList(deferreds).addBoth(this.onClearedOthers_, this);
    }
  }

  /**
   * Handle all other settings deleted
   *
   * @param {!Array<!Array>} deferredListResults
   * @private
   */
  onClearedOthers_(deferredListResults) {
    var success = googArray.every(deferredListResults, function(deferredListResult) {
      return deferredListResult[0];
    }, this);

    if (!success) {
      log.warning(logger,
          'Failed to clear one or more of the setting storages after switching write location. ' +
          'If this storage becomes accessible in the future, the remnant settings may affect application preferences ' +
          'since they will be merged with the others upon session initialization.');
    }

    this.dispatchEvent(new GoogEvent(ConfigEventType.SAVED));
  }

  /**
   * Sends an updated event
   */
  update() {
    log.fine(logger, 'Settings updated');
    this.dispatchEvent(new GoogEvent(ConfigEventType.UPDATED));
  }

  /**
   * Remove all keys and values from the storage.  Calling this function will wipe out settings for this application in
   * the settings service as well.  Use wisely.
   *
   * @param {string=} opt_namespace
   * @return {!Promise}
   */
  reset(opt_namespace) {
    var namespace = opt_namespace || appNs;
    log.info(logger, 'Resetting settings for the application namespace: ' + namespace);

    return new Promise((resolve, reject) => {
      // get the current storage type. this shouldn't be changed by the reset, so we'll restore it later.
      var type = this.get(Settings.WRITE_STORAGE_KEY,
          window.localStorage.getItem(Settings.WRITE_STORAGE_BACKUP_KEY) ||
          SettingsWritableStorageType.LOCAL);

      var storage = this.storageRegistry_.getWriteStorage();
      if (storage) {
        Promise.all([storage.deleteSettings(coreNs),
          storage.deleteSettings(namespace)]).then(() => {
          log.fine(logger, 'Reset settings success');

          // clear the user config section then save the storage type back to it
          this.actualConfig_[ConfigType.PREFERENCE] = {};
          if (type === SettingsWritableStorageType.REMOTE &&
              !this.storageRegistry_.hasRemoteStorage) {
            this.set(Settings.WRITE_STORAGE_KEY, SettingsWritableStorageType.LOCAL, true);
          } else {
            osObject.deleteValue(this.mergedConfig_, ['storage', 'writeType']);
            this.set(Settings.WRITE_STORAGE_KEY, type, true);
          }

          // set a metric for settings.reset
          Metrics.getInstance().updateMetric(SettingsMetrics.RESET_SETTINGS, 1);
          // publish all metrics immediately
          Metrics.getInstance().publish();

          // save the most recent reset date and time in local storage
          var currentApp = namespace;
          localStorage.setItem('resetDate', currentApp + ' ' + new Date().toISOString());
          // save current date time in settings
          this.set('reset.last', Date());

          // save settings before resolving or rejecting the promise
          this.save().then(resolve, reject);
        }, (opt_reason) => {
          // delete failed, so log the error and reject the promise
          var errorMsg = 'Reset settings failed' + (opt_reason ? (': ' + opt_reason) : '');
          log.error(logger, errorMsg);
          reject(errorMsg);
        });
      } else {
        reject('Write storage not available.');
      }
    });
  }

  /**
   * Retrieve the last reset date for the current application if defined
   *
   * @return {string}
   */
  getLastReset() {
    try {
      var resetDate = new Date(this.actualConfig_[ConfigType.PREFERENCE][appNs]['reset']['last'])
          .toISOString().replace(/T/, ' ').replace(/(.000)/, ' ');
    } catch (TypeError) {
      var resetDate = 'Never!';
    }
    return resetDate;
  }

  /**
   * Retrieve the settings' peer info objects
   *
   * @param {string=} opt_type The optional message type.
   * @return {Array<PeerInfo>}
   */
  getPeerInfo(opt_type) {
    return this.peer_ ? this.peer_.getPeerInfo(opt_type) : null;
  }

  /**
   * Get a COPY of a config value multiple levels deep.
   *
   * @param {!(Array<number|string>|string)} keys A period-delimited string of keys (ie, one.two.three), or an array of
   *                                              keys (as strings, or numbers, for array-like objects).
   * @param {*=} opt_default Default value
   * @return {*} The resulting value, or the default value if not found.
   */
  get(keys, opt_default) {
    if (typeof keys == 'string') {
      keys = keys.split('.');
    }

    if (this.loaded_) {
      var val = googObject.getValueByKeys(this.mergedConfig_, keys);
      if (Array.isArray(val)) {
        val = googArray.clone(val);
      } else if (goog.isObject(val)) {
        val = googObject.clone(val);
      }

      return val !== undefined ? val : opt_default;
    } else {
      throw new Error('Attempted to get a value before settings were loaded!');
    }
  }

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
  set(keys, value, opt_localOnly) {
    if (this.loaded_) {
      if (typeof keys == 'string') {
        keys = keys.split('.');
      }

      var oldVal = this.get(keys);

      if (this.isExternal_(value)) {
        // clone externally created objects/arrays to prevent a leak when the external context is closed
        value = osObject.unsafeClone(value);
      }

      osObject.setValue(this.mergedConfig_, keys, value);

      var isAdminKey = this.isAdmin_(keys);
      var namespacedKeys = [];

      if (!isAdminKey) {
        namespacedKeys = osConfigNamespace.getPrefixedKeys(keys);
        osObject.setValue(this.actualConfig_[ConfigType.PREFERENCE], namespacedKeys, value);
      }

      if (oldVal != value) {
        if (!isAdminKey) {
          osObject.setValue(this.deltaConfig_, namespacedKeys, value);
          this.markKeysForDelete_(keys, value, oldVal);
        }

        this.dispatchChange_(keys, value, oldVal, opt_localOnly);
      }
    } else {
      throw new Error('Attempted to set a value before settings were loaded!');
    }
  }

  /**
   * We have to explicitly delete keys instead of simply removing the value from config.  This function handles
   * making that change so clients don't have to handle the details.
   *
   * @param {!Array<!string>|!string} keys
   */
  delete(keys) {
    if (typeof keys == 'string') {
      keys = keys.split('.');
    }

    var oldVal = this.get(keys);

    osObject.deleteValue(this.mergedConfig_, keys);

    var namespacedKeys = osConfigNamespace.getPrefixedKeys(keys);
    osObject.deleteValue(this.actualConfig_[ConfigType.PREFERENCE], namespacedKeys);

    if (goog.typeOf(oldVal) === 'object') {
      // delete elements of a deeply nested object
      this.markKeysForDelete_(keys, undefined, oldVal);
    } else {
      // delete the key entirely
      googArray.insert(osConfigNamespace.keysToDelete, osConfigNamespace.getPrefixedKey(keys.join('.')));
    }

    this.dispatchChange_(keys, undefined, oldVal);
  }

  /**
   * Dispatch change event, optionally also send notification over XT
   *
   * @param {!Array<!string|!number>} keys
   * @param {*} newVal
   * @param {*} oldVal
   * @param {boolean=} opt_localOnly
   * @private
   */
  dispatchChange_(keys, newVal, oldVal, opt_localOnly) {
    var joined = keys.join('.');
    this.dispatchEvent(new SettingChangeEvent(joined, newVal, oldVal));

    if (!opt_localOnly) {
      this.changed_ = true;
      var namespacedKeys = osConfigNamespace.getPrefixedKeys(keys);

      if (joined == Settings.WRITE_STORAGE_KEY) {
        this.peer_.send(namespacedKeys[0], {keys: keys, newValue: newVal});
      } else {
        googArray.insert(this.toNotifyExternal_, {namespace: namespacedKeys[0], keys: keys});
      }

      if (this.saveDelay_) {
        this.saveDelay_.start();
      }
    }
  }

  /**
   * Determine if the keys are admin keys
   *
   * @param {!Array<!string|!number>} keys
   * @return {boolean}
   * @private
   */
  isAdmin_(keys) {
    return googObject.getValueByKeys(this.actualConfig_[ConfigType.CONFIG], keys) !== undefined;
  }

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
  markKeysForDelete_(keys, newVal, oldVal) {
    if (goog.typeOf(oldVal) === 'object') {
      var oldObjKeys = Object.keys(osObject.reduce(oldVal));
      var newObjKeys = newVal != null ? Object.keys(osObject.reduce(newVal)) : [];
      var keysAsStr = keys.join('.');
      oldObjKeys.forEach(function(oldObjKey) {
        if (!newObjKeys.includes(oldObjKey)) {
          googArray.insert(osConfigNamespace.keysToDelete, osConfigNamespace.getPrefixedKey(keysAsStr + '.' +
              oldObjKey));
        }
      });
    }
  }

  /**
   * Test if a value was created in an external window context. This only matters for objects and arrays, which will cause
   * a leak if we keep a reference and the external window is closed.
   *
   * @param {?} value The value
   * @return {boolean} If the value should be cloned.
   * @private
   */
  isExternal_(value) {
    return !(value instanceof Object || value instanceof Array) && typeof value === 'object';
  }

  /**
   * Handle failed communication with user settings.  Disable persistence. This should place the
   * application in an "offline" mode, where any settings from this session are not remembered.
   *
   * @param {string=} opt_error Error or message
   * @private
   */
  fail_(opt_error) {
    var e = opt_error || 'Failed to connect to user settings';
    log.error(logger, e);
    this.persistenceEnabled_ = false;
  }

  /**
   * Send an applicaiton alert that settings failed
   *
   * @param {number=} opt_delay
   * @private
   */
  alertFailure_(opt_delay) {
    // {@todo is there a better way to fire alert before alert directive is ready than settimeout?}
    setTimeout(function() {
      var dismissAlertEventTarget = new EventTarget();
      var dismissAlert = function() {
        dismissAlertEventTarget.dispatchEvent(new GoogEvent(AlertEventTypes.DISMISS_ALERT));
      };
      this.listenOnce(Settings.WRITE_STORAGE_KEY, dismissAlert, false, this);
      var alertMgr = AlertManager.getInstance();
      alertMgr.sendAlert('<strong>Settings are unavailable!</strong> This session will continue to run without any ' +
          'previously saved options, and any changes you make will not be remembered for the next session.',
      AlertEventSeverity.ERROR, undefined, 1, dismissAlertEventTarget);
    }.bind(this), opt_delay || 2500);
  }

  /**
   * @param {number=} opt_delay
   * @private
   */
  alertOneFailed_(opt_delay) {
    var alertMgr = AlertManager.getInstance();
    alertMgr.sendAlertOnce('Settings failed to load from one or more sources. This session will continue to run, but ' +
        'you may notice some of your previously saved preferences are not available.', AlertEventSeverity.WARNING);
  }

  /**
   * Send an application alert to confirm that the settings storage has been updated.
   *
   * @private
   */
  alertTypeChange_() {
    var type = this.storageRegistry_.getWriteStorageType();
    var alertMgr = AlertManager.getInstance();
    var msg = 'Success!  Your settings are now being saved ';
    switch (type) {
      case SettingsWritableStorageType.LOCAL:
        msg += 'locally.  Your preferences will remain tied to your current work station.';
        break;
      case SettingsWritableStorageType.REMOTE:
        msg += 'to the server.  Your preferences will follow you as you move to different locations.';
        break;
      default:
        break;
    }

    alertMgr.sendAlert(msg, AlertEventSeverity.INFO);
  }

  /**
   * @inheritDoc
   * @see {IMessageHandler}
   */
  getTypes() {
    return [coreNs, appNs];
  }

  /**
   * @inheritDoc
   * @see {IMessageHandler}
   */
  process(data, type, sender, time) {
    var settingsMessage = /** @type {SettingsMessage} */ (data);
    if (settingsMessage.keys && settingsMessage.keys.join('.') === Settings.WRITE_STORAGE_KEY) {
      this.setWriteStorageType(
          /** @type {SettingsWritableStorageType} */ (settingsMessage.newValue));
    } else {
      // save off the current value on the message and queue it for processing after the reload
      settingsMessage.oldValue = this.get(settingsMessage.keys);
      this.toNotifyInternal_.push(settingsMessage);
    }
    this.reloadDelay_.start();
  }

  /**
   * Get the global instance.
   * @return {!Settings}
   */
  static getInstance() {
    let instance = getSettings(true);
    if (!instance) {
      instance = new Settings();
      setSettings(instance);
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {!Settings} value
   */
  static setInstance(value) {
    setSettings(value);
    os.settings = value;
  }
}


/**
 * Logger
 * @type {goog.log.Logger}
 */
const logger = log.getLogger('os.config.Settings');


/**
 * The settings key
 * @type {string}
 */
const settingsKey = 'settings';


/**
 * Key to hold the storage writeType.
 * @const {string}
 */
Settings.WRITE_STORAGE_KEY = 'storage.writeType';


/**
 * Key to save the write storage type to local storage as a backup in case other storages don't load properly.
 * @const {string}
 */
Settings.WRITE_STORAGE_BACKUP_KEY = 'opensphere.config.' + Settings.WRITE_STORAGE_KEY;


/**
 * Legacy global settings reference. This should eventually be deprecated and removed.
 * @type {!Settings}
 * @deprecated Please use os.config.Settings.getInstance() instead.
 */
os.settings = Settings.getInstance();

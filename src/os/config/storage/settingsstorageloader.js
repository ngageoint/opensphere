goog.provide('os.config.storage.SettingsStorageLoader');
goog.require('goog.async.Deferred');
goog.require('goog.async.DeferredList');
goog.require('goog.log.Logger');
goog.require('os.array');
goog.require('os.config.storage.ISettingsReadableStorage');
goog.require('os.config.storage.SettingsFile');



/**
 * Class used to manage loading  settings from each of the registered storage
 *
 * @param {!os.config.storage.SettingsStorageRegistry} registry
 * @constructor
 */
os.config.storage.SettingsStorageLoader = function(registry) {
  /**
   * @type {!os.config.storage.SettingsStorageRegistry}
   * @private
   */
  this.registry_ = registry;

  /**
   * @type {number}
   * @private
   */
  this.currentReadIndex_ = 0;

  /**
   * Maintains the merged loaded config from all storages
   * @type {!Object}
   * @private
   */
  this.loadConfig_ = {};
};


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.config.storage.SettingsStorageLoader.LOGGER_ = goog.log.getLogger('os.config.storage.SettingsStorageLoader');


/**
 * Initialize all of the registered storage
 *
 * @return {!goog.async.Deferred}
 */
os.config.storage.SettingsStorageLoader.prototype.init = function() {
  var deferreds = [];

  for (var i = 0, ii = this.registry_.getNumberOfStorages(); i < ii; i++) {
    deferreds.push(this.registry_.getStorageAt(i).init());
  }

  if (deferreds.length) {
    return new goog.async.DeferredList(deferreds).addCallback(this.onInit_, this);
  } else {
    return goog.async.Deferred.fail('No settings storages registered.');
  }
};


/**
 * Handle results of deferred list, marking any storages that failed to load as such
 *
 * @param {!Array.<!Array.<boolean, *>>} deferredListResults
 * @private
 */
os.config.storage.SettingsStorageLoader.prototype.onInit_ = function(deferredListResults) {
  os.array.forEach(deferredListResults, function(deferredListResult, index) {
    if (!deferredListResult[0]) {
      this.registry_.getStorageAt(index).canAccess = false;
    }
  }, this);
};


/**
 * Load all of the settings as defined in the registry
 *
 * @return {!goog.async.Deferred}
 */
os.config.storage.SettingsStorageLoader.prototype.loadAll = function() {
  this.currentReadIndex_ = 0;
  this.loadConfig_ = {};
  this.loadConfig_[os.config.ConfigType.PREFERENCE] = {};
  this.loadConfig_[os.config.ConfigType.CONFIG] = {};
  return this.getNext_();
};


/**
 * Load the next set of settings based on the maintained current index
 *
 * @return {!goog.async.Deferred}
 * @private
 */
os.config.storage.SettingsStorageLoader.prototype.getNext_ = function() {
  if (this.currentReadIndex_ < this.registry_.getNumberOfStorages()) {
    var deferred = this.registry_.getStorageAt(this.currentReadIndex_).getSettings();
    deferred.addCallback(this.onGet_, this).addErrback(this.onGetFail_, this);
    return deferred;
  } else {
    return goog.async.Deferred.succeed(this.loadConfig_);
  }
};


/**
 * Handle single storage load success
 *
 * @param {Object} loadedConfig
 * @return {!goog.async.Deferred}
 * @private
 */
os.config.storage.SettingsStorageLoader.prototype.onGet_ = function(loadedConfig) {
  // check for overrides files and add them as storages that need to be loaded
  var loadedConfigCopy = /** @type {Object} */ (os.object.unsafeClone(loadedConfig));
  if (goog.object.containsKey(loadedConfigCopy, os.config.ConfigType.OVERRIDES)) {
    var overrides = loadedConfigCopy[os.config.ConfigType.OVERRIDES];
    if (goog.isArray(overrides)) {
      for (var i = 0, ii = overrides.length; i < ii; i++) {
        this.registry_.addStorage(
            new os.config.storage.SettingsFile(overrides[i], true), this.currentReadIndex_ + i + 1);
      }
    }
  }

  // if we have user settings, pull them out and add them.
  if (goog.object.containsKey(loadedConfig, os.config.ConfigType.PREFERENCE)) {
    var pref = /** @type {Object} */ (os.object.unsafeClone(loadedConfig[os.config.ConfigType.PREFERENCE]));

    // pull in both the os and application settings
    var nsArr = [os.config.coreNs, os.config.appNs];
    for (var i = 0, ii = nsArr.length; i < ii; i++) {
      var ns = nsArr[i];
      var reducedPrefs = os.object.reduce(pref[ns]);
      var reducedPrefsCopy = {};

      goog.object.forEach(reducedPrefs, function(value, key) {
        if (key) {
          var existingKeys = os.config.ConfigType.PREFERENCE + '.' + ns + '.' + key;
          var existingVal = goog.object.getValueByKeys(this.loadConfig_, existingKeys.split('.'));
          if (goog.isArray(existingVal) && goog.isArray(value) &&
              JSON.stringify(existingVal) != JSON.stringify(value)) {
            goog.log.info(os.config.storage.SettingsStorageLoader.LOGGER_, 'Merging settings arrays - ' +
                'existingVal: ' + existingVal + ', value: ' + value);
            goog.array.insertArrayAt(/** @type {Array} */ (value), /** @type {Array} */ (existingVal),
                /** @type {Array} */ (value).length);
            goog.log.info(os.config.storage.SettingsStorageLoader.LOGGER_, 'Result of merge: ' + value);
          }

          reducedPrefsCopy[key] = value;
        }
      }, this);

      // append the reduced copy in
      pref[ns] = os.object.expand(reducedPrefsCopy);
    }

    // finally, merge the preferences object into the loadConfig
    os.object.merge(pref, this.loadConfig_[os.config.ConfigType.PREFERENCE]);
  }

  // merge admin settings in last so that they override everything
  if (goog.object.containsKey(loadedConfig, os.config.ConfigType.CONFIG)) {
    var conf = /** @type {Object} */ (os.object.unsafeClone(loadedConfig[os.config.ConfigType.CONFIG]));
    os.object.merge(conf, this.loadConfig_[os.config.ConfigType.CONFIG]);
  }

  this.currentReadIndex_ += 1;
  return this.getNext_();
};


/**
 * Handle failure to get settings from an individual storage
 *
 * @return {!goog.async.Deferred}
 * @private
 */
os.config.storage.SettingsStorageLoader.prototype.onGetFail_ = function() {
  this.registry_.getStorageAt(this.currentReadIndex_).canAccess = false;
  this.currentReadIndex_ += 1;
  return this.getNext_();
};

goog.declareModuleId('os.config.storage.SettingsStorageLoader');

import {expand, merge, reduce, unsafeClone} from '../../object/object.js';
import {appNs, coreNs} from '../config.js';
import ConfigType from '../configtype.js';
import SettingsFile from './settingsfile.js';

const Deferred = goog.require('goog.async.Deferred');
const DeferredList = goog.require('goog.async.DeferredList');
const log = goog.require('goog.log');
const {containsKey, forEach, getValueByKeys} = goog.require('goog.object');

const Logger = goog.requireType('goog.log.Logger');
const {default: SettingsStorageRegistry} = goog.requireType('os.config.storage.SettingsStorageRegistry');


/**
 * Class used to manage loading  settings from each of the registered storage
 */
export default class SettingsStorageLoader {
  /**
   * Constructor.
   * @param {!SettingsStorageRegistry} registry
   */
  constructor(registry) {
    /**
     * @type {!SettingsStorageRegistry}
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
  }

  /**
   * Initialize all of the registered storage
   *
   * @return {!Deferred}
   */
  init() {
    var deferreds = [];

    for (var i = 0, ii = this.registry_.getNumberOfStorages(); i < ii; i++) {
      deferreds.push(this.registry_.getStorageAt(i).init());
    }

    if (deferreds.length) {
      return new DeferredList(deferreds).addCallback(this.onInit_, this);
    } else {
      return Deferred.fail('No settings storages registered.');
    }
  }

  /**
   * Handle results of deferred list, marking any storages that failed to load as such
   *
   * @param {!Array<!Array<boolean, *>>} deferredListResults
   * @private
   */
  onInit_(deferredListResults) {
    deferredListResults.forEach(function(deferredListResult, index) {
      if (!deferredListResult[0]) {
        this.registry_.getStorageAt(index).canAccess = false;
      }
    }, this);
  }

  /**
   * Load all of the settings as defined in the registry
   *
   * @return {!Deferred}
   */
  loadAll() {
    this.currentReadIndex_ = 0;
    this.loadConfig_ = {};
    this.loadConfig_[ConfigType.PREFERENCE] = {};
    this.loadConfig_[ConfigType.CONFIG] = {};
    return this.getNext_();
  }

  /**
   * Load the next set of settings based on the maintained current index
   *
   * @return {!Deferred}
   * @private
   */
  getNext_() {
    if (this.currentReadIndex_ < this.registry_.getNumberOfStorages()) {
      var deferred = this.registry_.getStorageAt(this.currentReadIndex_).getSettings();
      deferred.addCallback(this.onGet_, this).addErrback(this.onGetFail_, this);
      return deferred;
    } else {
      return Deferred.succeed(this.loadConfig_);
    }
  }

  /**
   * Handle single storage load success
   *
   * @param {Object} loadedConfig
   * @return {!Deferred}
   * @private
   */
  onGet_(loadedConfig) {
    // check for overrides files and add them as storages that need to be loaded
    var loadedConfigCopy = /** @type {Object} */ (unsafeClone(loadedConfig));
    if (containsKey(loadedConfigCopy, ConfigType.OVERRIDES)) {
      var overrides = loadedConfigCopy[ConfigType.OVERRIDES];
      if (Array.isArray(overrides)) {
        for (var i = 0, ii = overrides.length; i < ii; i++) {
          this.registry_.addStorage(
              new SettingsFile(overrides[i], true), this.currentReadIndex_ + i + 1);
        }
      }
    }

    // if we have user settings, pull them out and add them.
    if (containsKey(loadedConfig, ConfigType.PREFERENCE)) {
      var pref = /** @type {Object} */ (unsafeClone(loadedConfig[ConfigType.PREFERENCE]));

      // pull in both the os and application settings
      var nsArr = [coreNs, appNs];
      for (var i = 0, ii = nsArr.length; i < ii; i++) {
        var ns = nsArr[i];
        var reducedPrefs = reduce(pref[ns]);
        var reducedPrefsCopy = {};

        forEach(reducedPrefs, (value, key) => {
          if (key) {
            var existingKeys = ConfigType.PREFERENCE + '.' + ns + '.' + key;
            var existingVal = getValueByKeys(this.loadConfig_, existingKeys.split('.'));
            if (Array.isArray(existingVal) && Array.isArray(value) &&
                JSON.stringify(existingVal) != JSON.stringify(value)) {
              log.info(logger, 'Merging settings arrays - ' + 'existingVal: ' + existingVal + ', value: ' + value);
              value.push(...existingVal);
              log.info(logger, 'Result of merge: ' + value);
            }

            reducedPrefsCopy[key] = value;
          }
        });

        // append the reduced copy in
        pref[ns] = expand(reducedPrefsCopy);
      }

      // finally, merge the preferences object into the loadConfig
      merge(pref, this.loadConfig_[ConfigType.PREFERENCE]);
    }

    // merge admin settings in last so that they override everything
    if (containsKey(loadedConfig, ConfigType.CONFIG)) {
      var conf = /** @type {Object} */ (unsafeClone(loadedConfig[ConfigType.CONFIG]));
      merge(conf, this.loadConfig_[ConfigType.CONFIG]);
    }

    this.currentReadIndex_ += 1;
    return this.getNext_();
  }

  /**
   * Handle failure to get settings from an individual storage
   *
   * @return {!Deferred}
   * @private
   */
  onGetFail_() {
    this.registry_.getStorageAt(this.currentReadIndex_).canAccess = false;
    this.currentReadIndex_ += 1;
    return this.getNext_();
  }
}


/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.config.storage.SettingsStorageLoader');

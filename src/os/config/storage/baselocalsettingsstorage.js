goog.module('os.config.storage.BaseLocalSettingsStorage');

const Deferred = goog.require('goog.async.Deferred');
const DeferredList = goog.require('goog.async.DeferredList');
const ConfigType = goog.require('os.config.ConfigType');
const SettingsWritableStorageType = goog.require('os.config.storage.SettingsWritableStorageType');

const ISettingsReadableStorage = goog.requireType('os.config.storage.ISettingsReadableStorage');
const ISettingsStorage = goog.requireType('os.config.storage.ISettingsStorage');
const ISettingsWritableStorage = goog.requireType('os.config.storage.ISettingsWritableStorage');
const AsyncStorage = goog.requireType('os.storage.AsyncStorage');


/**
 * Base class for implementing locally accessible settings storages.
 *
 * @implements {ISettingsStorage}
 * @implements {ISettingsReadableStorage}
 * @implements {ISettingsWritableStorage}
 */
class BaseLocalSettingsStorage {
  /**
   * Constructor.
   * @param {!Array<!string>} namespaces The namespaces of the settings
   */
  constructor(namespaces) {
    /**
     * @inheritDoc
     */
    this.name = 'base class';

    /**
     * @inheritDoc
     */
    this.canAccess = true;

    /**
     * @inheritDoc
     */
    this.needsCleared = false;

    /**
     * @inheritDoc
     */
    this.writeType = SettingsWritableStorageType.LOCAL;

    /**
     * @inheritDoc
     */
    this.canInsertDeltas = false;

    /**
     * @type {!Array<!string>}
     * @protected
     */
    this.namespaces = namespaces;

    /**
     * @type {AsyncStorage}
     * @protected
     */
    this.store;
  }

  /**
   * @inheritDoc
   */
  init() {
    if (this.store) {
      return this.store.init().addCallback(this.onInit, this);
    } else {
      return Deferred.fail('Storage is undefined');
    }
  }

  /**
   * Handle successfuly init.  Does nothing, subclasses may override.
   *
   * @return {Deferred|null|undefined}
   * @protected
   */
  onInit() {
    return undefined;
  }

  /**
   * @inheritDoc
   */
  getSettings() {
    var deferreds = [];
    var prefs = {};
    prefs[ConfigType.PREFERENCE] = {};

    this.namespaces.forEach(function(namespace) {
      deferreds.push(this.store.get(namespace));
    }, this);

    var deferredList = new DeferredList(deferreds, false, true, false, undefined, this);
    deferredList.addCallbacks(this.onGet_, this.onFail_, this);
    return deferredList;
  }

  /**
   * Callback for the deferred list for retrieving all settings namespaces
   *
   * @param {!Array<!Array<boolean, *>>} deferredListResults
   * @return {Deferred|Object}
   * @private
   */
  onGet_(deferredListResults) {
    var prefs = {};
    prefs[ConfigType.PREFERENCE] = {};

    var success = true;

    // DeferredList results are an array of 2-element arrays indicating the result of every deferred in the list.
    // The first index is pass/fail boolean, the second index is the results
    deferredListResults.forEach(function(deferredListResult, index) {
      success = success && deferredListResult[0];
      if (success) {
        var namespace = this.namespaces[index];
        var nsPrefs = deferredListResult[1] || {};
        prefs[ConfigType.PREFERENCE][namespace] = nsPrefs;
      }
    }, this);

    if (!success) {
      return Deferred.fail('Failed to retrieve part or all of the settings');
    } else {
      return prefs;
    }
  }

  /**
   * Handle failure get for an individual key.
   *
   * @private
   */
  onFail_() {
    this.canAccess = false;
  }

  /**
   * @inheritDoc
   */
  setSettings(map) {
    var deferreds = [];
    try {
      this.namespaces.forEach(function(namespace) {
        var prefs = map[namespace] || {};
        deferreds.push(this.store.set(namespace, prefs, true));
      }, this);

      var deferredList = new DeferredList(deferreds, false, true, false, undefined, this);
      deferredList.addCallback(this.onSet_, this);
      return deferredList;
    } catch (e) {
      return Deferred.fail('Failed to save settings: ' + e.message);
    }
  }

  /**
   * Handle settings set
   *
   * @param {!Array<!Array<boolean, *>>} deferredListResults
   * @return {Deferred|null|undefined}
   * @private
   */
  onSet_(deferredListResults) {
    var success = goog.array.every(deferredListResults, function(deferredListResult) {
      return deferredListResult[0];
    });

    if (!success) {
      return Deferred.fail('Failed to save part or all of settings');
    }
  }

  /**
   * @inheritDoc
   */
  deleteSettings(ns) {
    if (this.store) {
      return this.store.remove(ns);
    } else {
      return Deferred.succeed();
    }
  }
}

exports = BaseLocalSettingsStorage;

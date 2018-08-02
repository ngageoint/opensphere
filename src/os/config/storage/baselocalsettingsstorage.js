goog.provide('os.config.storage.BaseLocalSettingsStorage');
goog.require('goog.async.Deferred');
goog.require('goog.async.DeferredList');
goog.require('os.config');
goog.require('os.config.storage.ISettingsReadableStorage');
goog.require('os.config.storage.ISettingsStorage');
goog.require('os.config.storage.ISettingsWritableStorage');
goog.require('os.config.storage.SettingsWritableStorageType');
goog.require('os.storage.AsyncStorage');



/**
 * Base class for implementing locally accessible settings storages.
 * @constructor
 * @implements {os.config.storage.ISettingsStorage}
 * @implements {os.config.storage.ISettingsReadableStorage}
 * @implements {os.config.storage.ISettingsWritableStorage}
 * @param {!Array.<!string>} namespaces The namespaces of the settings
 */
os.config.storage.BaseLocalSettingsStorage = function(namespaces) {
  /**
   * @type {!Array.<!string>}
   * @protected
   */
  this.namespaces = namespaces;

  /**
   * @type {os.storage.AsyncStorage}
   * @protected
   */
  this.store;
};


/**
 * @inheritDoc
 */
os.config.storage.BaseLocalSettingsStorage.prototype.init = function() {
  if (this.store) {
    return this.store.init().addCallback(this.onInit, this);
  } else {
    return goog.async.Deferred.fail('Storage is undefined');
  }
};


/**
 * Handle successfuly init.  Does nothing, subclasses may override.
 * @return {goog.async.Deferred|null|undefined}
 * @protected
 */
os.config.storage.BaseLocalSettingsStorage.prototype.onInit = function() {
  return undefined;
};


/**
 * @inheritDoc
 */
os.config.storage.BaseLocalSettingsStorage.prototype.getSettings = function() {
  var deferreds = [];
  var prefs = {};
  prefs[os.config.ConfigType.PREFERENCE] = {};

  goog.array.forEach(this.namespaces, function(namespace) {
    deferreds.push(this.store.get(namespace));
  }, this);

  var deferredList = new goog.async.DeferredList(deferreds, false, true, false, undefined, this);
  deferredList.addCallbacks(this.onGet_, this.onFail_, this);
  return deferredList;
};


/**
 * Callback for the deferred list for retrieving all settings namespaces
 * @param {!Array.<!Array.<boolean, *>>} deferredListResults
 * @return {goog.async.Deferred|Object}
 * @private
 */
os.config.storage.BaseLocalSettingsStorage.prototype.onGet_ = function(deferredListResults) {
  var prefs = {};
  prefs[os.config.ConfigType.PREFERENCE] = {};

  var success = true;

  // DeferredList results are an array of 2-element arrays indicating the result of every deferred in the list.
  // The first index is pass/fail boolean, the second index is the results
  goog.array.forEach(deferredListResults, function(deferredListResult, index) {
    success = success && deferredListResult[0];
    if (success) {
      var namespace = this.namespaces[index];
      var nsPrefs = deferredListResult[1] || {};
      prefs[os.config.ConfigType.PREFERENCE][namespace] = nsPrefs;
    }
  }, this);

  if (!success) {
    return goog.async.Deferred.fail('Failed to retrieve part or all of the settings');
  } else {
    return prefs;
  }
};


/**
 * Handle failure get for an individual key.
 * @private
 */
os.config.storage.BaseLocalSettingsStorage.prototype.onFail_ = function() {
  this.canAccess = false;
};


/**
 * @inheritDoc
 */
os.config.storage.BaseLocalSettingsStorage.prototype.setSettings = function(map) {
  var deferreds = [];
  try {
    goog.array.forEach(this.namespaces, function(namespace) {
      var prefs = map[namespace] || {};
      deferreds.push(this.store.set(namespace, prefs, true));
    }, this);

    var deferredList = new goog.async.DeferredList(deferreds, false, true, false, undefined, this);
    deferredList.addCallback(this.onSet_, this);
    return deferredList;
  } catch (e) {
    return goog.async.Deferred.fail('Failed to save settings: ' + e.message);
  }
};


/**
 * Handle settings set
 * @param {!Array.<!Array.<boolean, *>>} deferredListResults
 * @return {goog.async.Deferred|null|undefined}
 * @private
 */
os.config.storage.BaseLocalSettingsStorage.prototype.onSet_ = function(deferredListResults) {
  var success = goog.array.every(deferredListResults, function(deferredListResult) {
    return deferredListResult[0];
  });

  if (!success) {
    return goog.async.Deferred.fail('Failed to save part or all of settings');
  }
};


/**
 * @inheritDoc
 */
os.config.storage.BaseLocalSettingsStorage.prototype.deleteSettings = function(ns) {
  if (this.store) {
    return this.store.remove(ns);
  } else {
    return goog.async.Deferred.succeed();
  }
};


/**
 * @inheritDoc
 */
os.config.storage.BaseLocalSettingsStorage.prototype.name = 'base class';


/**
 * @inheritDoc
 */
os.config.storage.BaseLocalSettingsStorage.prototype.canAccess = true;


/**
 * @inheritDoc
 */
os.config.storage.BaseLocalSettingsStorage.prototype.needsCleared = false;


/**
 * @inheritDoc
 */
os.config.storage.BaseLocalSettingsStorage.prototype.writeType = os.config.storage.SettingsWritableStorageType.LOCAL;


/**
 * @inheritDoc
 */
os.config.storage.BaseLocalSettingsStorage.prototype.canInsertDeltas = false;

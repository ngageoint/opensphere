goog.provide('os.config.storage.SettingsObjectStorage');
goog.require('goog.async.Deferred');
goog.require('goog.object');
goog.require('os.config.storage.ISettingsReadableStorage');
goog.require('os.config.storage.ISettingsStorage');
goog.require('os.config.storage.ISettingsWritableStorage');
goog.require('os.config.storage.SettingsWritableStorageType');



/**
 * A storage for settings which reads/writes to an in-memory JSON object.  This is not used in production,
 * but is useful for transient settings for things like unit tests.
 * @implements {os.config.storage.ISettingsStorage<*>}
 * @implements {os.config.storage.ISettingsReadableStorage<*>}
 * @implements {os.config.storage.ISettingsWritableStorage<*>}
 * @constructor
 * @param {!Array.<!string>} namespaces
 * @param {Object.<string, *>=} opt_initialSettings
 */
os.config.storage.SettingsObjectStorage = function(namespaces, opt_initialSettings) {
  /**
   * @type {!Array.<!string>}
   * @protected
   */
  this.namespaces = namespaces;

  /**
   * The settings storage object
   * @type {!Object.<string, *>}
   */
  this.store = {};

  if (opt_initialSettings) {
    this.setSettings_(opt_initialSettings);
  }
};
os.implements(os.config.storage.SettingsObjectStorage, os.config.storage.ISettingsStorage.ID);
os.implements(os.config.storage.SettingsObjectStorage, os.config.storage.ISettingsReadableStorage.ID);
os.implements(os.config.storage.SettingsObjectStorage, os.config.storage.ISettingsWritableStorage.ID);


/**
 * @inheritDoc
 */
os.config.storage.SettingsObjectStorage.prototype.canAccess = true;


/**
 * @inheritDoc
 */
os.config.storage.SettingsObjectStorage.prototype.name = 'object';


/**
 * @inheritDoc
 */
os.config.storage.SettingsObjectStorage.prototype.writeType = os.config.storage.SettingsWritableStorageType.LOCAL;


/**
 * @inheritDoc
 */
os.config.storage.SettingsObjectStorage.prototype.needsCleared = false;


/**
 * @inheritDoc
 */
os.config.storage.SettingsObjectStorage.prototype.canInsertDeltas = false;


/**
 * @inheritDoc
 */
os.config.storage.SettingsObjectStorage.prototype.init = function() {
  try {
    for (var i = 0, ii = this.namespaces.length; i < ii; i++) {
      var ns = this.namespaces[i];
      this.store[ns] = this.store[ns] || {};
    }
    return goog.async.Deferred.succeed();
  } catch (e) {
    return goog.async.Deferred.fail('Failed to init settings: ' + e.message);
  }
};


/**
 * @inheritDoc
 */
os.config.storage.SettingsObjectStorage.prototype.getSettings = function() {
  var prefs = {};
  prefs[os.config.ConfigType.PREFERENCE] = goog.object.unsafeClone(this.store);
  return goog.async.Deferred.succeed(prefs);
};


/**
 * @inheritDoc
 */
os.config.storage.SettingsObjectStorage.prototype.setSettings = function(map, opt_delete) {
  try {
    this.setSettings_(map);
    return goog.async.Deferred.succeed();
  } catch (e) {
    return goog.async.Deferred.fail('Failed to save settings: ' + e.message);
  }
};


/**
 * Apply the keys/values of the given map to settings
 * @param {Object.<string, *>} map
 * @private
 */
os.config.storage.SettingsObjectStorage.prototype.setSettings_ = function(map) {
  goog.array.forEach(this.namespaces, function(namespace) {
    var prefs = map[namespace] || {};
    this.store[namespace] = prefs;
  }, this);
};


/**
 * @inheritDoc
 */
os.config.storage.SettingsObjectStorage.prototype.deleteSettings = function(ns) {
  try {
    delete this.store[ns];
    return goog.async.Deferred.succeed();
  } catch (e) {
    return goog.async.Deferred.fail('Failed to delete settings:' + e.message);
  }
};


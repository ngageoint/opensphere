goog.provide('os.config.storage.SettingsIDBStorage');
goog.require('goog.array');
goog.require('goog.async.Deferred');
goog.require('goog.async.DeferredList');
goog.require('goog.functions');
goog.require('goog.object');
goog.require('os.config.storage.BaseLocalSettingsStorage');
goog.require('os.config.storage.ISettingsReadableStorage');
goog.require('os.config.storage.ISettingsStorage');
goog.require('os.config.storage.ISettingsWritableStorage');
goog.require('os.config.storage.SettingsWritableStorageType');
goog.require('os.implements');
goog.require('os.storage.IDBStorage');



/**
 * Asynchronous storage used for persisting settings to IndexedDb
 * @implements {os.config.storage.ISettingsStorage}
 * @implements {os.config.storage.ISettingsReadableStorage}
 * @implements {os.config.storage.ISettingsWritableStorage}
 * @extends {os.config.storage.BaseLocalSettingsStorage}
 * @constructor
 * @param {!Array.<!string>} namespaces The namespaces of the settings
 * @param {number=} opt_version The database version
 */
os.config.storage.SettingsIDBStorage = function(namespaces, opt_version) {
  os.config.storage.SettingsIDBStorage.base(this, 'constructor', namespaces);

  this.store = new os.storage.IDBStorage(
      os.config.storage.SettingsIDBStorage.STORE_NAME, os.SETTINGS_DB_NAME, opt_version);
};
goog.inherits(os.config.storage.SettingsIDBStorage, os.config.storage.BaseLocalSettingsStorage);
os.implements(os.config.storage.SettingsIDBStorage, os.config.storage.ISettingsStorage.ID);
os.implements(os.config.storage.SettingsIDBStorage, os.config.storage.ISettingsReadableStorage.ID);
os.implements(os.config.storage.SettingsIDBStorage, os.config.storage.ISettingsWritableStorage.ID);


/**
 * @type {string}
 */
os.config.storage.SettingsIDBStorage.STORE_NAME = 'settings';


/**
 * @inheritDoc
 */
os.config.storage.SettingsIDBStorage.prototype.name = 'IndexedDb';

goog.module('os.config.storage.SettingsIDBStorage');

const {SETTINGS_DB_NAME} = goog.require('os');
const BaseLocalSettingsStorage = goog.require('os.config.storage.BaseLocalSettingsStorage');
const ISettingsReadableStorage = goog.require('os.config.storage.ISettingsReadableStorage');
const ISettingsStorage = goog.require('os.config.storage.ISettingsStorage');
const ISettingsWritableStorage = goog.require('os.config.storage.ISettingsWritableStorage');
const osImplements = goog.require('os.implements');
const IDBStorage = goog.require('os.storage.IDBStorage');


/**
 * Asynchronous storage used for persisting settings to IndexedDb
 *
 * @implements {ISettingsStorage}
 * @implements {ISettingsReadableStorage}
 * @implements {ISettingsWritableStorage}
 */
class SettingsIDBStorage extends BaseLocalSettingsStorage {
  /**
   * Constructor.
   * @param {!Array<!string>} namespaces The namespaces of the settings
   * @param {number=} opt_version The database version
   */
  constructor(namespaces, opt_version) {
    super(namespaces);
    this.store = new IDBStorage(SettingsIDBStorage.STORE_NAME, SETTINGS_DB_NAME, opt_version);

    /**
     * @inheritDoc
     */
    this.name = 'IndexedDb';
  }
}
osImplements(SettingsIDBStorage, ISettingsStorage.ID);
osImplements(SettingsIDBStorage, ISettingsReadableStorage.ID);
osImplements(SettingsIDBStorage, ISettingsWritableStorage.ID);


/**
 * @type {string}
 */
SettingsIDBStorage.STORE_NAME = 'settings';


exports = SettingsIDBStorage;

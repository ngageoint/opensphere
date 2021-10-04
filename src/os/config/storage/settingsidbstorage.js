goog.declareModuleId('os.config.storage.SettingsIDBStorage');

import osImplements from '../../implements.js';
import {SETTINGS_DB_NAME} from '../../os.js';
import IDBStorage from '../../storage/idbstorage.js';
import BaseLocalSettingsStorage from './baselocalsettingsstorage.js';
import ISettingsReadableStorage from './isettingsreadablestorage.js';
import ISettingsStorage from './isettingsstorage.js';
import ISettingsWritableStorage from './isettingswritablestorage.js';


/**
 * Asynchronous storage used for persisting settings to IndexedDb
 *
 * @implements {ISettingsStorage}
 * @implements {ISettingsReadableStorage}
 * @implements {ISettingsWritableStorage}
 */
export default class SettingsIDBStorage extends BaseLocalSettingsStorage {
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

goog.declareModuleId('os.config.storage.ISettingsReadableStorage');

const Deferred = goog.requireType('goog.async.Deferred');
const {default: ISettingsStorage} = goog.requireType('os.config.storage.ISettingsStorage');


/**
 * @interface
 * @extends {ISettingsStorage}
 * @template T
 */
export default class ISettingsReadableStorage {
  /**
   * Retrieve all settings values from storage
   * @return {!Deferred<Object<string, T>>}
   * @template T
   */
  getSettings() {}
}


/**
 * ID for the interface
 * @const {string}
 */
ISettingsReadableStorage.ID = 'os.config.storage.ISettingsReadableStorage';

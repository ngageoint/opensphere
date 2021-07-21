goog.module('os.config.storage.ISettingsReadableStorage');
goog.module.declareLegacyNamespace();

const Deferred = goog.requireType('goog.async.Deferred');
const ISettingsStorage = goog.requireType('os.config.storage.ISettingsStorage');


/**
 * @interface
 * @extends {ISettingsStorage}
 * @template T
 */
class ISettingsReadableStorage {
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


exports = ISettingsReadableStorage;

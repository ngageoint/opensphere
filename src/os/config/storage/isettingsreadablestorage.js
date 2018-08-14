goog.provide('os.config.storage.ISettingsReadableStorage');
goog.require('goog.async.Deferred');
goog.require('os.config.storage.ISettingsStorage');



/**
 * @interface
 * @extends {os.config.storage.ISettingsStorage}
 * @template T
 */
os.config.storage.ISettingsReadableStorage = function() {};


/**
 * ID for the interface
 * @const {string}
 */
os.config.storage.ISettingsReadableStorage.ID = 'os.config.storage.ISettingsReadableStorage';


/**
 * Retrieve all settings values from storage
 * @return {!goog.async.Deferred.<Object.<string, T>>}
 * @template T
 */
os.config.storage.ISettingsReadableStorage.prototype.getSettings;


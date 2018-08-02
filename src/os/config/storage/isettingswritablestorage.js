goog.provide('os.config.storage.ISettingsWritableStorage');
goog.require('os.config.storage.ISettingsReadableStorage');
goog.require('os.config.storage.SettingsWritableStorageType');



/**
 * @interface
 * @extends {os.config.storage.ISettingsReadableStorage}
 * @template T
 */
os.config.storage.ISettingsWritableStorage = function() {};


/**
 * ID for the interface
 * @const {string}
 */
os.config.storage.ISettingsWritableStorage.ID = 'os.config.storage.ISettingsWritableStorage';


/**
 * Set all settings values to storage
 * @param {Object.<string, T>} map The keys and values to write to settings service
 * @param {Array.<string>=} opt_delete Optional keys to delete from settings service. Note that not
 *   all implementations need this argument.  Clients should ensure the map does not include the deleted keys.
 *   Some implementations overwrite, where deleted keys will disappear naturally, and others do a merge,
 *   which requires additional calls to delete.  Clients can always provide deleted keys and not worry about the
 *   backend - the service will deteremine if a delete is necessary.
 * @return {!goog.async.Deferred}
 */
os.config.storage.ISettingsWritableStorage.prototype.setSettings;


/**
 * Removes all keys and values from storage in the given namespace
 * @param {string} ns
 * @return {!goog.async.Deferred}
 */
os.config.storage.ISettingsWritableStorage.prototype.deleteSettings;


/**
 * @type {os.config.storage.SettingsWritableStorageType}
 */
os.config.storage.ISettingsWritableStorage.prototype.writeType;


/**
 * Determines if the settings need to be cleared from this storage.  All writable storages should be
 * set to be cleared except for the currently active one.  This allows the client to swap from one storage to another,
 * and clear the old storage in favor of the new.
 * @type {boolean}
 */
os.config.storage.ISettingsWritableStorage.prototype.needsCleared;


/**
 * Determines if the settings storage can handle inserting partial settings keys.  If true, only the deltas will be
 * provided for persistence; otherwise the entire settings block will be passed in.
 * @type {boolean}
 */
os.config.storage.ISettingsWritableStorage.prototype.canInsertDeltas;

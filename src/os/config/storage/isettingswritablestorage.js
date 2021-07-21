goog.module('os.config.storage.ISettingsWritableStorage');
goog.module.declareLegacyNamespace();

const ISettingsReadableStorage = goog.requireType('os.config.storage.ISettingsReadableStorage');
const SettingsWritableStorageType = goog.requireType('os.config.storage.SettingsWritableStorageType');


/**
 * @interface
 * @extends {ISettingsReadableStorage}
 * @template T
 */
class ISettingsWritableStorage {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {SettingsWritableStorageType}
     */
    this.writeType;

    /**
     * Determines if the settings need to be cleared from this storage.  All writable storages should be
     * set to be cleared except for the currently active one.  This allows the client to swap from one storage to another,
     * and clear the old storage in favor of the new.
     * @type {boolean}
     */
    this.needsCleared;

    /**
     * Determines if the settings storage can handle inserting partial settings keys.  If true, only the deltas will be
     * provided for persistence; otherwise the entire settings block will be passed in.
     * @type {boolean}
     */
    this.canInsertDeltas;
  }

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
  setSettings(map, opt_delete) {}

  /**
   * Removes all keys and values from storage in the given namespace
   * @param {string} ns
   * @return {!goog.async.Deferred}
   */
  deleteSettings(ns) {}
}


/**
 * ID for the interface
 * @const {string}
 */
ISettingsWritableStorage.ID = 'os.config.storage.ISettingsWritableStorage';


exports = ISettingsWritableStorage;

goog.module('os.config.storage.SettingsStorageRegistry');
goog.module.declareLegacyNamespace();

const ISettingsWritableStorage = goog.require('os.config.storage.ISettingsWritableStorage');
const SettingsWritableStorageType = goog.require('os.config.storage.SettingsWritableStorageType');
const osImplements = goog.require('os.implements');

const ISettingsReadableStorage = goog.requireType('os.config.storage.ISettingsReadableStorage');


/**
 * Registry for which storage types are supported for settings
 */
class SettingsStorageRegistry {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * Storages from which settings should be read and initialized.
     * @type {!Array<!ISettingsReadableStorage>}
     * @private
     */
    this.availableReadStorages_ = [];

    /**
     * The type of storage that should be written to.  Defaults to local, but can be updated any time.
     * @type {SettingsWritableStorageType}
     * @private
     */
    this.writeToType_ = SettingsWritableStorageType.LOCAL;

    /**
     * The preferred storage to which user settings will be saved
     * @type {?ISettingsWritableStorage}
     * @private
     */
    this.writeToStorage_ = null;

    /**
     * Flag set when any remote storage provider
     * has been added to the registry.
     * @type {boolean}
     */
    this.hasRemoteStorage = false;
  }

  /**
   * Add a readable storage to the registry.  All the registered storages will be read, merged and used to initialize
   * the application.
   *
   * @param {!ISettingsReadableStorage} storage
   * @param {number=} opt_index
   */
  addStorage(storage, opt_index) {
    const idx = opt_index !== undefined ? opt_index : this.availableReadStorages_.length;
    this.availableReadStorages_.splice(idx, 0, storage);
    if (osImplements(storage, ISettingsWritableStorage.ID)) {
      if ((/** @type {ISettingsWritableStorage} */ (storage)).writeType === SettingsWritableStorageType.REMOTE) {
        this.hasRemoteStorage = true;
      }
    }
  }

  /**
   * @return {number}
   */
  getNumberOfStorages() {
    return this.availableReadStorages_.length;
  }

  /**
   * Retrieve storage from a specific index
   *
   * @param {!number} index
   * @return {?ISettingsReadableStorage}
   */
  getStorageAt(index) {
    return this.availableReadStorages_[index] || null;
  }

  /**
   * @return {SettingsWritableStorageType}
   */
  getWriteStorageType() {
    return this.writeToType_;
  }

  /**
   * Assign the preferred storage type for saving settings.  The highest priority, registered, writable storage
   * will be used.  If none of that type are found, it will become null and saving settings will not be supported.
   *
   * @param {SettingsWritableStorageType} type
   * @return {boolean} Whether a storage of that type has been assigned
   */
  setWriteStorageType(type) {
    this.writeToType_ = type;
    this.updateWriteStorage_();
    return !!this.writeToStorage_;
  }

  /**
   * Use the assigned write storage type to identify the appropriate registered storage.  If a registered storage is
   * marked as failing, attempt to find another of that type (gracefully rollover).  If no other storage is registered
   * as that type, assign the writeStorage to null.
   *
   * @private
   */
  updateWriteStorage_() {
    var writeTo = null;
    for (var i = this.availableReadStorages_.length - 1; i >= 0; i--) {
      var candidate = this.availableReadStorages_[i];
      if (osImplements(candidate, ISettingsWritableStorage.ID) &&
          (/** @type {ISettingsWritableStorage} */ (candidate)).writeType ===
              this.writeToType_ && candidate.canAccess) {
        writeTo = candidate;
        break;
      }
    }
    this.writeToStorage_ = /** @type {?ISettingsWritableStorage} */ (writeTo);

    if (this.writeToStorage_) {
      for (var i = this.availableReadStorages_.length - 1; i >= 0; i--) {
        var candidate = this.availableReadStorages_[i];
        if (osImplements(candidate, ISettingsWritableStorage.ID) && candidate !== this.writeToStorage_) {
          /** @type {ISettingsWritableStorage} */ (candidate).needsCleared = true;
        }
      }
      /** @type {ISettingsWritableStorage} */ (this.writeToStorage_).needsCleared = false;
    }
  }

  /**
   * Retrieve the preferred storage to which settings will be written.
   *
   * @return {?ISettingsWritableStorage}
   */
  getWriteStorage() {
    if (!(this.writeToStorage_ && this.writeToStorage_.canAccess)) {
      this.updateWriteStorage_();
    }
    return this.writeToStorage_;
  }

  /**
   * Retrieve all registered storages that are writable and need to be cleared out.  This occurs after the designated
   * write storage
   *
   * @return {!Array<!ISettingsWritableStorage>}
   */
  getStoragesToClear() {
    var writablesToClear = this.availableReadStorages_.filter(function(storage) {
      return osImplements(storage, ISettingsWritableStorage.ID) &&
      /** @type {ISettingsWritableStorage} */ (storage).needsCleared;
    }, this);
    return /** @type {!Array<!ISettingsWritableStorage>} */ (writablesToClear);
  }

  /**
   * Reset storage registry
   */
  reset() {
    this.availableReadStorages_.length = 0;
    this.writeToType_ = SettingsWritableStorageType.LOCAL;
    this.writeToStorage_ = null;
    this.hasRemoteStorage = false;
  }

  /**
   * Get the global instance.
   * @return {!SettingsStorageRegistry}
   */
  static getInstance() {
    if (!instance) {
      instance = new SettingsStorageRegistry();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {SettingsStorageRegistry} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {SettingsStorageRegistry|undefined}
 */
let instance;


exports = SettingsStorageRegistry;

goog.provide('os.config.storage.SettingsStorageRegistry');
goog.require('goog.array');
goog.require('goog.async.Deferred');
goog.require('os.config.storage.ISettingsReadableStorage');
goog.require('os.config.storage.ISettingsWritableStorage');
goog.require('os.config.storage.SettingsWritableStorageType');



/**
 * Registry for which storage types are supported for settings
 * @constructor
 */
os.config.storage.SettingsStorageRegistry = function() {
  /**
   * Storages from which settings should be read and initialized.
   * @type {!Array.<!os.config.storage.ISettingsReadableStorage>}
   * @private
   */
  this.availableReadStorages_ = [];

  /**
   * The type of storage that should be written to.  Defaults to local, but can be updated any time.
   * @type {os.config.storage.SettingsWritableStorageType}
   * @private
   */
  this.writeToType_ = os.config.storage.SettingsWritableStorageType.LOCAL;

  /**
   * The preferred storage to which user settings will be saved
   * @type {?os.config.storage.ISettingsWritableStorage}
   * @private
   */
  this.writeToStorage_ = null;

  /**
   * Flag set when any remote storage provider
   * has been added to the registry.
   * @type {boolean}
   */
  this.hasRemoteStorage = false;
};
goog.addSingletonGetter(os.config.storage.SettingsStorageRegistry);


/**
 * Add a readable storage to the registry.  All the registered storages will be read, merged and used to initialize
 * the application.
 * @param {!os.config.storage.ISettingsReadableStorage} storage
 * @param {number=} opt_index
 */
os.config.storage.SettingsStorageRegistry.prototype.addStorage = function(storage, opt_index) {
  goog.array.insertAt(this.availableReadStorages_, storage,
      goog.isDef(opt_index) ? opt_index : this.availableReadStorages_.length);
  if (storage.writeType === os.config.storage.SettingsWritableStorageType.REMOTE) {
    this.hasRemoteStorage = true;
  }
};


/**
 * @return {number}
 */
os.config.storage.SettingsStorageRegistry.prototype.getNumberOfStorages = function() {
  return this.availableReadStorages_.length;
};


/**
 * Retrieve storage from a specific index
 * @param {!number} index
 * @return {?os.config.storage.ISettingsReadableStorage}
 */
os.config.storage.SettingsStorageRegistry.prototype.getStorageAt = function(index) {
  return this.availableReadStorages_[index] || null;
};


/**
 * @return {os.config.storage.SettingsWritableStorageType}
 */
os.config.storage.SettingsStorageRegistry.prototype.getWriteStorageType = function() {
  return this.writeToType_;
};


/**
 * Assign the preferred storage type for saving settings.  The highest priority, registered, writable storage
 * will be used.  If none of that type are found, it will become null and saving settings will not be supported.
 * @param {os.config.storage.SettingsWritableStorageType} type
 * @return {boolean} Whether a storage of that type has been assigned
 */
os.config.storage.SettingsStorageRegistry.prototype.setWriteStorageType = function(type) {
  this.writeToType_ = type;
  this.updateWriteStorage_();
  return !!this.writeToStorage_;
};


/**
 * Use the assigned write storage type to identify the appropriate registered storage.  If a registered storage is
 * marked as failing, attempt to find another of that type (gracefully rollover).  If no other storage is registered
 * as that type, assign the writeStorage to null.
 * @private
 */
os.config.storage.SettingsStorageRegistry.prototype.updateWriteStorage_ = function() {
  var writeTo = null;
  for (var i = this.availableReadStorages_.length - 1; i >= 0; i--) {
    var candidate = this.availableReadStorages_[i];
    if (os.implements(candidate, os.config.storage.ISettingsWritableStorage.ID) &&
        candidate.writeType === this.writeToType_ && candidate.canAccess) {
      writeTo = candidate;
      break;
    }
  }
  this.writeToStorage_ = /** @type {?os.config.storage.ISettingsWritableStorage} */ (writeTo);

  if (this.writeToStorage_) {
    for (var i = this.availableReadStorages_.length - 1; i >= 0; i--) {
      var candidate = this.availableReadStorages_[i];
      if (os.implements(candidate, os.config.storage.ISettingsWritableStorage.ID) &&
          candidate !== this.writeToStorage_) {
        /** @type {os.config.storage.ISettingsWritableStorage} */ (candidate).needsCleared = true;
      }
    }
    /** @type {os.config.storage.ISettingsWritableStorage} */ (this.writeToStorage_).needsCleared = false;
  }
};


/**
 * Retrieve the preferred storage to which settings will be written.
 * @return {?os.config.storage.ISettingsWritableStorage}
 */
os.config.storage.SettingsStorageRegistry.prototype.getWriteStorage = function() {
  if (!(this.writeToStorage_ && this.writeToStorage_.canAccess)) {
    this.updateWriteStorage_();
  }
  return this.writeToStorage_;
};


/**
 * Retrieve all registered storages that are writable and need to be cleared out.  This occurs after the designated
 * write storage
 * @return {!Array.<!os.config.storage.ISettingsWritableStorage>}
 */
os.config.storage.SettingsStorageRegistry.prototype.getStoragesToClear = function() {
  var writablesToClear = goog.array.filter(this.availableReadStorages_, function(storage) {
    return os.implements(storage, os.config.storage.ISettingsWritableStorage.ID) &&
        /** @type {os.config.storage.ISettingsWritableStorage} */ (storage).needsCleared;
  }, this);
  return /** @type {!Array.<!os.config.storage.ISettingsWritableStorage>} */ (writablesToClear);
};

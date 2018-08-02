goog.provide('os.file.FileStorage');

goog.require('goog.Disposable');
goog.require('goog.async.Deferred');
goog.require('goog.db.Error');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.string.path');
goog.require('os.config');
goog.require('os.defines');
goog.require('os.file');
goog.require('os.storage.AsyncStorageWrapper');
goog.require('os.storage.IDBStorage');
goog.require('os.storage.ObjectMechanism');



/**
 * Stores local files using IndexedDB when available, or a local cache if IDB is not supported.
 * @extends {goog.Disposable}
 * @param {string=} opt_dbname
 * @constructor
 */
os.file.FileStorage = function(opt_dbname) {
  os.file.FileStorage.base(this, 'constructor');
  this.log = os.file.FileStorage.LOGGER_;

  /**
   * Map of which files exist in storage so {@link os.file.FileStorage#fileExists} can be called synchronously.
   * @type {!Object<string, boolean>}
   * @private
   */
  this.files_ = {};

  /**
   * @type {os.storage.AsyncStorage<!os.file.File>}
   * @protected
   */
  this.storage = new os.storage.IDBStorage(os.FILE_STORE_NAME, opt_dbname || os.FILE_DB_NAME, os.FILE_DB_VERSION);
  this.storage.deserializeItem = os.file.deserializeFile;
  this.storage.serializeItem = os.file.serializeFile;

  this.storage.init().addCallbacks(this.onStorageReady_, this.onStorageError_, this);
};
goog.inherits(os.file.FileStorage, goog.Disposable);
goog.addSingletonGetter(os.file.FileStorage);


/**
 * Logger
 * @type {goog.log.Logger}
 * @const
 * @private
 */
os.file.FileStorage.LOGGER_ = goog.log.getLogger('os.file.FileStorage');


/**
 * @define {string} The database name. Override this in the application to use a separate database for storage.
 */
goog.define('os.FILE_DB_NAME', os.NAMESPACE + '.files');


/**
 * @define {number} The database version.
 */
goog.define('os.FILE_DB_VERSION', 2);


/**
 * @define {string} The file store name
 */
goog.define('os.FILE_STORE_NAME', 'files');


/**
 * File storage settings base key.
 * @type {string}
 * @const
 */
os.file.FileStorage.BASE_KEY = os.FILE_STORE_NAME;


/**
 * @enum {string}
 * @const
 */
os.file.FileStorageSetting = {
  ASK_TO_UPLOAD: os.file.FileStorage.BASE_KEY + '.askToUpload',
  UPLOAD_LOCAL: os.file.FileStorage.BASE_KEY + '.uploadLocal'
};


/**
 * @inheritDoc
 */
os.file.FileStorage.prototype.disposeInternal = function() {
  os.file.FileStorage.base(this, 'disposeInternal');

  goog.dispose(this.storage);
  this.storage = null;
};


/**
 * Handle successful IndexedDB storage initialization.
 * @private
 */
os.file.FileStorage.prototype.onStorageReady_ = function() {
  this.storage.getAll().addCallbacks(this.onFilesReady_, this.onStorageError_, this);
};


/**
 * Handle IndexedDB storage error, degrading to using local storage.
 * @param {goog.db.Error|string=} opt_error The error.
 * @private
 */
os.file.FileStorage.prototype.onStorageError_ = function(opt_error) {
  goog.dispose(this.storage);
  this.storage = new os.storage.AsyncStorageWrapper(new os.storage.ObjectMechanism(), os.file.deserializeFile,
      os.file.serializeFile);
};


/**
 * Handle {@code getAll} success. Updates the cache of files stored in the database.
 * @param {Array<os.file.File>} files
 * @private
 */
os.file.FileStorage.prototype.onFilesReady_ = function(files) {
  for (var i = 0, n = files.length; i < n; i++) {
    var url = files[i].getUrl();
    if (url) {
      this.files_[url] = true;
    }
  }
};


/**
 * Clears all files from storage.
 * @return {!goog.async.Deferred} The deferred delete request.
 */
os.file.FileStorage.prototype.clear = function() {
  return this.storage.clear().addCallback(this.onFilesCleared_, this);
};


/**
 * Deletes a file from storage.
 * @param {!(os.file.File|string)} file The file to delete.
 * @return {!goog.async.Deferred} The deferred delete request.
 */
os.file.FileStorage.prototype.deleteFile = function(file) {
  var fileKey = typeof file == 'string' ? file : file.getUrl();
  if (!fileKey) {
    var filename = typeof file == 'string' ? 'undefined' : file.getFileName();
    var error = new goog.async.Deferred();
    error.errback('Unable delete a file (' + filename + ') with a null/empty url!');
    return error;
  }

  return this.storage.remove(fileKey).addCallback(goog.partial(this.onFileRemoved_, fileKey), this);
};


/**
 * Checks if a file exists in the database.
 * @param {(string|os.file.File)} file The file or path to look for
 * @return {boolean} If the file exists in storage.
 */
os.file.FileStorage.prototype.fileExists = function(file) {
  var url = typeof file == 'string' ? file : file.getUrl();
  return !!url && this.files_[url] != null;
};


/**
 * Get a file from the database.
 * @param {string} url
 * @return {!goog.async.Deferred} The deferred store request.
 */
os.file.FileStorage.prototype.getFile = function(url) {
  return this.storage.get(url);
};


/**
 * Get all files from the database.
 * @return {!goog.async.Deferred} The deferred store request.
 */
os.file.FileStorage.prototype.getFiles = function() {
  return this.storage.getAll();
};


/**
 * If file storage is being persisted via IndexedDB.
 * @return {boolean}
 */
os.file.FileStorage.prototype.isPersistent = function() {
  return this.storage instanceof os.storage.IDBStorage;
};


/**
 * Updates the provided file's name/url to a unique value (not currently in storage). If the name isn't already unique,
 * new names will be generated by converting 'base.ext' to 'base-(1..n).ext'.
 * @param {!os.file.File} file
 */
os.file.FileStorage.prototype.setUniqueFileName = function(file) {
  // checking if it exists first also verifies it's a local file
  var name = file.getFileName();
  if (name && this.fileExists(file)) {
    var extension = goog.string.path.extension(name);
    var baseName = name.replace(new RegExp('.' + extension + '$'), '');
    var i = 1;
    do {
      var newName = baseName + '-' + i++ + '.' + extension;
      file.setFileName(newName);
      file.setUrl(os.file.getLocalUrl(newName));
    } while (this.fileExists(file));
  }
};


/**
 * Stores a file in the database.
 * @param {!os.file.File} file
 * @param {boolean=} opt_replace If the file should be replaced in the store.
 * @return {!goog.async.Deferred} The deferred store request.
 */
os.file.FileStorage.prototype.storeFile = function(file, opt_replace) {
  var url = file.getUrl();
  if (!url) {
    var error = new goog.async.Deferred();
    error.errback('Unable store a file (' + file.getFileName() + ') with a null/empty url!');
    return error;
  }

  return this.storage.set(url, file, opt_replace).addCallback(goog.partial(this.onFileStored_, url), this);
};


/**
 * Handle file stored successfully.
 * @param {string} key The file key.
 * @private
 */
os.file.FileStorage.prototype.onFileStored_ = function(key) {
  if (key) {
    this.files_[key] = true;
  }
};


/**
 * Handle file removed successfully.
 * @param {string} key The file key.
 * @private
 */
os.file.FileStorage.prototype.onFileRemoved_ = function(key) {
  if (key) {
    delete this.files_[key];
  }
};


/**
 * Handle files cleared.
 * @private
 */
os.file.FileStorage.prototype.onFilesCleared_ = function() {
  this.files_ = {};
};

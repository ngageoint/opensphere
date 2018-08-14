goog.provide('os.file.persist.LocalFilePersistence');
goog.require('goog.events.Event');
goog.require('os.ex.IPersistenceMethod');
goog.require('os.file.File');
goog.require('os.file.FileStorage');
goog.require('os.file.persist.FilePersistence');



/**
 * Persistence method to save local files.
 * @implements {os.ex.IPersistenceMethod}
 * @extends {os.file.persist.FilePersistence}
 * @param {string=} opt_dbStore
 * @constructor
 */
os.file.persist.LocalFilePersistence = function(opt_dbStore) {
  /**
   * @type {string|undefined}
   */
  this.dbstore = opt_dbStore;
};
goog.inherits(os.file.persist.LocalFilePersistence, os.file.persist.FilePersistence);


/**
 * local file event
 * @type {string}
 * @const
 */
os.file.persist.LocalFilePersistence.SAVE_COMPLETE = 'local.file.save.complete';


/**
 * local file event
 * @type {string}
 * @const
 */
os.file.persist.LocalFilePersistence.SAVE_FAILED = 'local.file.save.fail';


/**
 * @inheritDoc
 */
os.file.persist.LocalFilePersistence.prototype.getLabel = function() {
  return 'Local';
};


/**
 * @inheritDoc
 */
os.file.persist.LocalFilePersistence.prototype.save = function(name, content, opt_mimeType, opt_title, opt_descr,
    opt_tags) {
  return os.file.persist.saveLocal(name, content, opt_mimeType, this.dbstore);
};


/**
 * @param {os.file.File} file
 * @private
 */
os.file.persist.LocalFilePersistence.finishImport_ = function(file) {
  os.dispatcher.dispatchEvent(new goog.events.Event(os.file.persist.LocalFilePersistence.SAVE_COMPLETE,
      {'url': file.getUrl()}));
};


/**
 * Handler for file storage error.
 * @param {*} error
 * @private
 */
os.file.persist.LocalFilePersistence.onFileError_ = function(error) {
  var msg = 'Unable to store state file locally!';
  if (goog.isString(error)) {
    msg += ' ' + error;
  }
  os.dispatcher.dispatchEvent(new goog.events.Event(os.file.persist.LocalFilePersistence.SAVE_FAILED, {'error': msg}));
};


/**
 * Static function to save a file, so it can be used without the persistence
 * @param {string} fileName The file name
 * @param {Object|null|string} content The content to save
 * @param {string=} opt_mimeType The mime type of the content
 * @param {string=} opt_dbStore The local db name to store in
 * @return {boolean} Whether or not the save action was successfull
 */
os.file.persist.saveLocal = function(fileName, content, opt_mimeType, opt_dbStore) {
  var type = opt_mimeType || 'text/plain;charset=utf-8';
  var file = new os.file.File();
  file.setFileName(fileName);
  file.setUrl(os.file.getLocalUrl(fileName));
  file.setContent(content);
  file.setContentType(type);
  var fs = new os.file.FileStorage(opt_dbStore);
  fs.setUniqueFileName(file);
  fs.storeFile(file, true).addCallbacks(goog.partial(os.file.persist.LocalFilePersistence.finishImport_, file),
      os.file.persist.LocalFilePersistence.onFileError_);
  return true;
};

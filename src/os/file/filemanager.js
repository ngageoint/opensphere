goog.provide('os.file.FileManager');
goog.require('os.file');
goog.require('os.file.IContentTypeMethod');
goog.require('os.file.IFileMethod');



/**
 * Keeps a registry of methods for reading a file ({@link os.file.IFileMethod}) and a registry of content type
 * methods ({@link os.file.IContentTypeMethod}) for determining the file and layer type of a given file.
 * @constructor
 */
os.file.FileManager = function() {
  /**
   * Registered file import methods.
   * @type {!Array<!os.file.IFileMethod>}
   * @private
   */
  this.fileMethods_ = [];

  /**
   * Registered content type methods.
   * @type {!Array<!os.file.IContentTypeMethod>}
   * @private
   */
  this.ctMethods_ = [];
};
goog.addSingletonGetter(os.file.FileManager);


/**
 * Gets the highest-priority file method that is supported.
 * @return {?os.file.IFileMethod} The highest priority supported method.
 */
os.file.FileManager.prototype.getFileMethod = function() {
  var method = /** @type {os.file.IFileMethod} */ (goog.array.find(this.fileMethods_, this.isMethodSupported_));
  return method ? method.clone() : null;
};


/**
 * Given a content type or layer type hint, return the corresponding layer type.
 * @param {os.file.File} file The file reference.
 * @param {function(?string)} callback Callback when the type is available.
 */
os.file.FileManager.prototype.getLayerType = function(file, callback) {
  if (file.getContent() instanceof ArrayBuffer) {
    var content = /** @type {ArrayBuffer} */ (file.getContent());
    if (goog.isDef(window.zip) && os.file.isZipFile(content)) {
      // read the zip file
      zip.createReader(new zip.ArrayBufferReader(content), goog.bind(function(reader) {
        // get the entries in the zip file, then test for layer type using the entries
        reader.getEntries(this.getLayerTypeInternal_.bind(this, file, callback));
      }, this), function() {
        // failed reading the zip file
        var msg = 'Error reading zip file "' + file.getFileName() + '"!';
        os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.ERROR);
      });
      return;
    }
  }

  this.getLayerTypeInternal_(file, callback);
};


/**
 * Given a content type or layer type hint, return the corresponding layer type.
 * @param {os.file.File} file The file reference.
 * @param {function(?string)} callback Callback when the type is available.
 * @param {Array<zip.Entry>=} opt_zipEntries
 * @private
 */
os.file.FileManager.prototype.getLayerTypeInternal_ = function(file, callback, opt_zipEntries) {
  var type = null;
  var ctMethod = goog.array.find(this.ctMethods_, function(method) {
    return method.isType(file, opt_zipEntries);
  });

  if (ctMethod) {
    type = ctMethod.getLayerType().toLowerCase();
    file.setContentType(ctMethod.getContentType());
    file.setType(type);
  }

  callback(type);
};


/**
 * Given a content type or layer type hint, return the corresponding layer type.
 * @param {os.file.File} file The file reference.
 * @param {string} hint Content type hint.
 * @return {?string} The corresponding layer type, or null if no registered content type methods were matched.
 */
os.file.FileManager.prototype.getLayerTypeByContentHint = function(file, hint) {
  var type = null;
  var ctMethod = goog.array.find(this.ctMethods_, function(method) {
    return (method.getContentType() == hint || method.getLayerType() == hint) && method.isType(file);
  });

  if (ctMethod) {
    type = ctMethod.getLayerType().toLowerCase();
    file.setContentType(ctMethod.getContentType());
    file.setType(type);
  }

  return type;
};


/**
 * Whether or not there are any registered file methods that are supported.
 * @return {boolean} If at least one file method is supported, false otherwise.
 */
os.file.FileManager.prototype.hasSupportedMethod = function() {
  return goog.array.some(this.fileMethods_, this.isMethodSupported_);
};


/**
 * Convenience function for array searching/filtering.
 * @param {!(os.file.IFileMethod|os.file.IContentTypeMethod)} method The method.
 * @return {boolean}
 * @private
 */
os.file.FileManager.prototype.isMethodSupported_ = function(method) {
  return method.isSupported();
};


/**
 * Register a method for determining content type.
 * @param {!os.file.IContentTypeMethod} ctMethod The content type method.
 */
os.file.FileManager.prototype.registerContentTypeMethod = function(ctMethod) {
  if (!goog.array.contains(this.ctMethods_, ctMethod)) {
    this.ctMethods_.push(ctMethod);
    this.ctMethods_.sort(this.sortDescPriority_);
  }
};


/**
 * Register a method for importing a file.
 * @param {!os.file.IFileMethod} fileMethod The file import method.
 */
os.file.FileManager.prototype.registerFileMethod = function(fileMethod) {
  if (!goog.array.contains(this.fileMethods_, fileMethod)) {
    this.fileMethods_.push(fileMethod);
    this.fileMethods_.sort(this.sortDescPriority_);
  }
};


/**
 * Sort file/content type method by descending priority.
 * @param {!(os.file.IFileMethod|os.file.IContentTypeMethod)} a First method.
 * @param {!(os.file.IFileMethod|os.file.IContentTypeMethod)} b Second method.
 * @return {number}
 * @private
 */
os.file.FileManager.prototype.sortDescPriority_ = function(a, b) {
  return goog.array.defaultCompare(b.getPriority(), a.getPriority());
};

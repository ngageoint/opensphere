goog.provide('os.file.FileManager');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.array');
goog.require('os.file');
goog.require('os.file.mime');
goog.require('os.file.mime.text');


/**
 * Keeps a registry of methods for reading a file ({@link os.file.IFileMethod})
 *
 * @constructor
 */
os.file.FileManager = function() {
  /**
   * Registered file import methods.
   * @type {!Array<!os.file.IFileMethod>}
   * @private
   */
  this.fileMethods_ = [];
};
goog.addSingletonGetter(os.file.FileManager);


/**
 * Gets the highest-priority file method that is supported.
 *
 * @return {?os.file.IFileMethod} The highest priority supported method.
 */
os.file.FileManager.prototype.getFileMethod = function() {
  var method = /** @type {os.file.IFileMethod} */ (ol.array.find(this.fileMethods_, this.isMethodSupported_));
  return method ? method.clone() : null;
};


/**
 * Given a content type or layer type hint, return the corresponding layer type.
 *
 * @param {!os.file.File} file The file reference.
 * @param {function(?string)} callback Callback when the type is available.
 */
os.file.FileManager.prototype.getContentType = function(file, callback) {
  var buffer = file.getContent();
  var fileBlob = file.getFile();

  if (!buffer && !fileBlob) {
    var type = file.getType();

    if (!type) {
      goog.log.error(os.file.FileManager.LOGGER_,
          'The content or original File instance must be present on the os.file.File for content type '
          + 'detection to work');
    }

    callback(type);
    return;
  }

  if (buffer && typeof buffer === 'string') {
    // convert the string to an ArrayBuffer and continue with the check
    buffer = os.file.mime.text.getArrayBuffer(buffer);
  }

  var onComplete = function(type) {
    if (type) {
      var chain = os.file.mime.getTypeChain(type);
      if (chain && chain.indexOf(os.file.mime.text.TYPE) > -1) {
        file.convertContentToString();
      }

      file.setType(type);
    }

    return type;
  };

  // we are going to read the first 16KB and send that to the mime/content type detection
  if (buffer && buffer instanceof ArrayBuffer) {
    os.file.mime.detect(buffer, file).then(onComplete).then(callback);
  } else if (fileBlob instanceof Blob) {
    goog.fs.FileReader.readAsArrayBuffer(fileBlob.slice(0, 16 * 1024)).addCallback(function(buffer) {
      os.file.mime.detect(buffer, file).then(onComplete).then(callback);
    });
  } else {
    goog.log.error(os.file.FileManager.LOGGER_,
        'Failed to detect content type. The content was not a string or ArrayBuffer.');
  }
};


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.file.FileManager.LOGGER_ = goog.log.getLogger('os.file.FileManager');


/**
 * Given a content type or layer type hint, return the corresponding layer type.
 * @param {!os.file.File} file The file reference.
 * @param {function(?string)} callback Callback when the type is available.
 * @deprecated use os.file.FileManager.prototype.getContentType() instead
 */
os.file.FileManager.prototype.getLayerType = os.file.FileManager.prototype.getContentType;


/**
 * Whether or not there are any registered file methods that are supported.
 *
 * @return {boolean} If at least one file method is supported, false otherwise.
 */
os.file.FileManager.prototype.hasSupportedMethod = function() {
  return goog.array.some(this.fileMethods_, this.isMethodSupported_);
};


/**
 * Convenience function for array searching/filtering.
 *
 * @param {!(os.file.IFileMethod)} method The method.
 * @return {boolean}
 * @private
 */
os.file.FileManager.prototype.isMethodSupported_ = function(method) {
  return method.isSupported();
};


/**
 * Register a method for importing a file.
 *
 * @param {!os.file.IFileMethod} fileMethod The file import method.
 */
os.file.FileManager.prototype.registerFileMethod = function(fileMethod) {
  if (!ol.array.includes(this.fileMethods_, fileMethod)) {
    this.fileMethods_.push(fileMethod);
    this.fileMethods_.sort(this.sortDescPriority_);
  }
};


/**
 * Sort file/content type method by descending priority.
 *
 * @param {!os.file.IFileMethod} a First method.
 * @param {!os.file.IFileMethod} b Second method.
 * @return {number}
 * @private
 */
os.file.FileManager.prototype.sortDescPriority_ = function(a, b) {
  return goog.array.defaultCompare(b.getPriority(), a.getPriority());
};

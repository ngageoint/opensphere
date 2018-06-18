goog.provide('os.file');
goog.provide('os.file.File');

goog.require('goog.async.Deferred');
goog.require('goog.fs.FileReader');
goog.require('goog.net.jsloader');
goog.require('os.IPersistable');
goog.require('os.defines');
goog.require('os.file.mime.zip');



/**
 * Representation of a file.
 * @implements {os.IPersistable}
 * @constructor
 */
os.file.File = function() {
  /**
   * @type {?(ArrayBuffer|Object|string)}
   * @private
   */
  this.content_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.contentType_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.fileName_ = null;

  /**
   * A reference to the original file from which this container was created. Not required, used only in
   * some cases.
   * @type {?File}
   * @private
   */
  this.file_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.type_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.url_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.encoding_ = null;
};


/**
 * Maximum content length for imported files.
 * @type {number}
 * @const
 */
os.file.File.MAX_CONTENT_LEN = 1024 * 1024 * 100;


/**
 * File URL schemes.
 * @enum {string}
 */
os.file.FileScheme = {
  FILE: 'file',
  LOCAL: 'local'
};


/**
 * If `file://` URL's should be supported by the application. Defaults to false.
 * @type {boolean}
 */
os.file.FILE_URL_ENABLED = false;


/**
 * @return {?string} The encoding used
 */
os.file.File.prototype.getEncoding = function() {
  return this.encoding_;
};


/**
 * @param {?string} value The encoding
 */
os.file.File.prototype.setEncoding = function(value) {
  this.encoding_ = value;
};


/**
 * @return {?(Object|string)}
 */
os.file.File.prototype.getContent = function() {
  return this.content_;
};


/**
 * @param {?(ArrayBuffer|Object|string)} value
 */
os.file.File.prototype.setContent = function(value) {
  this.content_ = value;
};


/**
 * Converts ArrayBuffer content to a string
 */
os.file.File.prototype.convertContentToString = function() {
  var value = this.getContent();
  if (value instanceof ArrayBuffer) {
    var ab = /** @type {ArrayBuffer} */ (value);
    var s = os.file.mime.text.getText(ab);
    if (s) {
      this.setContent(s);
    }
  }
};


/**
 * @return {?string}
 */
os.file.File.prototype.getContentType = function() {
  return this.contentType_;
};


/**
 * @param {?string} value
 */
os.file.File.prototype.setContentType = function(value) {
  this.contentType_ = value;
};


/**
 * @return {?string}
 */
os.file.File.prototype.getFileName = function() {
  return this.fileName_;
};


/**
 * @param {?string} value
 */
os.file.File.prototype.setFileName = function(value) {
  this.fileName_ = value;
};


/**
 * @return {?File}
 */
os.file.File.prototype.getFile = function() {
  return this.file_;
};


/**
 * @param {?File} value
 */
os.file.File.prototype.setFile = function(value) {
  this.file_ = value;
};


/**
 * @return {?string}
 */
os.file.File.prototype.getType = function() {
  return this.type_;
};


/**
 * @param {?string} value
 */
os.file.File.prototype.setType = function(value) {
  this.type_ = value;
};


/**
 * @return {?string}
 */
os.file.File.prototype.getUrl = function() {
  return this.url_;
};


/**
 * @param {?string} value
 */
os.file.File.prototype.setUrl = function(value) {
  this.url_ = value;
};


/**
 * @return {goog.async.Deferred|undefined}
 */
os.file.File.prototype.loadContent = function() {
  var origFile = this.getFile();
  if (origFile) {
    var deferred = new goog.async.Deferred();
    var scope = this;
    goog.fs.FileReader.readAsArrayBuffer(origFile).addCallback(
        function(resp) {
          scope.setContent(resp);
          return null;
        }).chainDeferred(deferred);
    return deferred;
  }
};


/**
 * @inheritDoc
 */
os.file.File.prototype.persist = function(opt_to) {
  var to = opt_to || {};
  to['content'] = this.content_;
  to['contentType'] = this.contentType_;
  to['fileName'] = this.fileName_;
  to['type'] = this.type_;
  to['url'] = this.url_;
  to['encoding'] = this.encoding_;

  return to;
};


/**
 * @inheritDoc
 */
os.file.File.prototype.restore = function(config) {
  this.content_ = config['content'] || null;
  this.contentType_ = config['contentType'] || null;
  this.fileName_ = config['fileName'] || null;
  this.type_ = config['type'] || null;
  this.url_ = config['url'] || null;
  this.encoding_ = config['encoding'] || null;
};


/**
 * @define {string}
 */
goog.define('os.file.ZIP_PATH', 'vendor/zip-js');


/**
 * Configure zip.js if it has been loaded.
 * @suppress {checkTypes}
 */
(function() {
  // zip.js definds 'zip' as global var.  If application is not using zip.js, skip this
  if (window.zip) {
    var zipPath = os.ROOT + os.file.ZIP_PATH + '/';
    if (!Modernizr.webworkers) {
      // disable web workers
      zip.useWebWorkers = false;

      // load the inflate/deflate scripts locally
      goog.net.jsloader.safeLoad(zipPath + 'inflate.js');
      goog.net.jsloader.safeLoad(zipPath + 'deflate.js');
    } else {
      // set the relative path to worker scripts so zip.js can find them
      zip.workerScriptsPath = zipPath;
    }
  }
})();



/**
 * Tests if an ArrayBuffer holds ZIP content by looking for the magic number.
 * @param {ArrayBuffer} content
 * @return {boolean}
 * @deprecated Please use os.file.mime.zip.isZip() instead.
 */
os.file.isZipFile = os.file.mime.zip.isZip;


/**
 * Check for the presence of the FileReader and ArrayBuffer APIs. We depend on these two HTML5 APIs to read and parse
 * files. FF 4+, Chrome 7+, and IE10+ support these, and we have a polyfill for ArrayBuffer supporting earlier browsers.
 * @return {boolean}
 */
os.file.canImport = function() {
  return !(typeof FileReader === 'undefined' || typeof ArrayBuffer === 'undefined');
};


/**
 * Creates a new os.file.File instance from a system file. The content will be read as a string if it's determined
 * to be text, or an ArrayBuffer if not.
 * @param {!File} file The system file
 * @return {!goog.async.Deferred} A promise passing the new file instance to the success callback, or the error message
 *   on failure.
 */
os.file.createFromFile = function(file) {
  var deferred = new goog.async.Deferred();

  if (file.path && os.file.FILE_URL_ENABLED) {
    deferred.callback(os.file.createFromContent(file.name, os.file.getFileUrl(file.path), file, null));
  } else if (file.size < os.file.File.MAX_CONTENT_LEN) {
    var url = os.file.getLocalUrl(file.name);
    goog.fs.FileReader.readAsArrayBuffer(file).addCallback(
        os.file.createFromContent.bind(undefined, file.name, url, file)).chainDeferred(deferred);
  } else {
    var limit = Math.floor(os.file.File.MAX_CONTENT_LEN / 1000000) + 'MB';
    var msg = 'File "' + file.name + '" exceeds the size limit (' + limit + ') and cannot be imported.';
    deferred.errback(msg);
  }

  return deferred;
};


/**
 * Creates a new os.file.File instance from the provided parameters, converting ArrayBuffer content to a string
 * if the content is determined to be text.
 * @param {string} fileName The name of the file
 * @param {string} url The URL to the file content
 * @param {File|undefined} originalFile Original file. If included, will be set on the os.file.File
 * @param {?(ArrayBuffer|string)} content The file content
 * @return {!os.file.File}
 */
os.file.createFromContent = function(fileName, url, originalFile, content) {
  var file = new os.file.File();
  file.setContent(content);
  file.setFileName(fileName);
  file.setUrl(url);

  if (originalFile) {
    file.setContentType(originalFile.type);
    file.setFile(originalFile);
  }

  return file;
};


/**
 * Creates a `file://` url to reference files on the file system.
 * @param {string} path The path to the file.
 * @return {string}
 */
os.file.getFileUrl = function(path) {
  return os.file.FileScheme.FILE + '://' + path;
};


/**
 * Creates a `local://` url used by file storage.
 * @param {string} fileName The file name to use in generating the url.
 * @return {string}
 */
os.file.getLocalUrl = function(fileName) {
  return os.file.FileScheme.LOCAL + '://' + btoa(fileName);
};


/**
 * Checks if a file was loaded from the file system (URL prefixed with `file://`).
 * @param {os.file.File|string|undefined} file The file or file's url
 * @return {boolean}
 */
os.file.isFileSystem = function(file) {
  if (!file) {
    return false;
  }

  var url = goog.isString(file) ? file : file.getUrl();
  return !!url && goog.string.startsWith(url, os.file.FileScheme.FILE + '://');
};


/**
 * Checks if a file was loaded from file storage (URL prefixed with `local://`).
 * @param {os.file.File|string|undefined} file The file or file's url.
 * @return {boolean}
 */
os.file.isLocal = function(file) {
  if (!file) {
    return false;
  }

  var url = goog.isString(file) ? file : file.getUrl();
  return !!url && goog.string.startsWith(url, os.file.FileScheme.LOCAL + '://');
};


/**
 * Deserializes a file from a JSON object.
 * @param {*} data The serialized file
 * @return {os.file.File}
 */
os.file.deserializeFile = function(data) {
  var file = null;
  if (data && goog.isObject(data)) {
    file = new os.file.File();
    file.restore(data);
  }

  return file;
};


/**
 * Serializes a file to a JSON object.
 * @param {os.file.File} file The file to serialize
 * @return {*} The persisted file
 */
os.file.serializeFile = function(file) {
  return file ? file.persist() : undefined;
};

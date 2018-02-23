goog.provide('os.net.LocalFileHandler');

goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('os.file.File');
goog.require('os.file.FileStorage');
goog.require('os.net.HandlerType');
goog.require('os.net.IRequestHandler');



/**
 * Handler for files in local storage.
 * @implements {os.net.IRequestHandler}
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.net.LocalFileHandler = function() {
  os.net.LocalFileHandler.base(this, 'constructor');

  /**
   * @type {?goog.async.Deferred}
   * @private
   */
  this.deferred_ = null;

  /**
   * @type {?os.file.File}
   * @private
   */
  this.file_ = null;

  this.statusCode = -1;
};
goog.inherits(os.net.LocalFileHandler, goog.events.EventTarget);


/**
 * The list of errors
 * @type {?Array.<string>}
 * @protected
 */
os.net.LocalFileHandler.prototype.errors = null;


/**
 * The score
 * @type {number}
 * @protected
 */
os.net.LocalFileHandler.prototype.score = 0;


/**
 * @inheritDoc
 */
os.net.LocalFileHandler.prototype.getErrors = function() {
  return this.errors;
};


/**
 * @inheritDoc
 */
os.net.LocalFileHandler.prototype.getScore = function() {
  return this.score;
};


/**
 * @inheritDoc
 */
os.net.LocalFileHandler.prototype.handles = function(method, uri) {
  return uri.getScheme() == os.file.FileScheme.LOCAL;
};


/**
 * @inheritDoc
 */
os.net.LocalFileHandler.prototype.buildRequest = function() {
  // no need
};


/**
 * @inheritDoc
 */
os.net.LocalFileHandler.prototype.getResponse = function() {
  return this.file_ ? this.file_.getContent() : null;
};


/**
 * @inheritDoc
 */
os.net.LocalFileHandler.prototype.getResponseHeaders = function() {
  return null;
};


/**
 * @inheritDoc
 */
os.net.LocalFileHandler.prototype.abort = function() {
  if (this.deferred_) {
    this.deferred_.cancel();
  }
};


/**
 * @inheritDoc
 */
os.net.LocalFileHandler.prototype.execute = function(method, uri, opt_headers, opt_formatter, opt_nocache,
    opt_responseType) {
  this.errors = null;
  this.file_ = null;

  var fs = os.file.FileStorage.getInstance();
  var filePath = decodeURIComponent(uri.toString());
  this.deferred_ = fs.getFile(filePath).addCallbacks(this.onFileReady_, this.onFileError_, this);
};


/**
 * @param {?os.file.File} file
 * @private
 */
os.net.LocalFileHandler.prototype.onFileReady_ = function(file) {
  this.deferred_ = null;

  if (file) {
    this.statusCode = 200;
    this.file_ = file;
    this.dispatchEvent(new goog.events.Event(goog.net.EventType.SUCCESS));
  } else {
    this.statusCode = 404;
    this.errors = ['File not found in local storage!'];
    this.dispatchEvent(new goog.events.Event(goog.net.EventType.ERROR));
  }
};


/**
 * @param {*} error
 * @private
 */
os.net.LocalFileHandler.prototype.onFileError_ = function(error) {
  this.deferred_ = null;
  this.errors = [];

  if (goog.isString(error)) {
    this.statusCode = 400;
    this.errors.push(/** @type {string} */ (error));
  } else {
    this.statusCode = 404;
    this.errors.push('File not found in local storage!');
  }

  this.dispatchEvent(new goog.events.Event(goog.net.EventType.ERROR));
};


/**
 * @inheritDoc
 */
os.net.LocalFileHandler.prototype.getStatusCode = function() {
  return this.statusCode;
};


/**
 * @inheritDoc
 */
os.net.LocalFileHandler.prototype.getHandlerType = function() {
  return os.net.HandlerType.LOCAL;
};


/**
 * @inheritDoc
 */
os.net.LocalFileHandler.prototype.isHandled = function() {
  if (this.statusCode && this.statusCode >= 0) {
    return true;
  }
  return false;
};

goog.provide('os.url.UrlManager');
goog.require('goog.array');
goog.require('goog.events.EventTarget');
goog.require('os.url');
goog.require('os.url.UrlEvent');



/**
 * The URL manager is responsible for handling parameters passed to the application by
 * dragging or dropping a URL or a tab in the window.  Plugins can register handlers with
 * the URL manager that are called when the URL that is dropped matches particular criteria.
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.url.UrlManager = function() {
  os.url.UrlManager.base(this, 'constructor');
  /**
   * @type {Object.<string, Array>}
   * @private
   */
  this.handlers_ = {};
};
goog.inherits(os.url.UrlManager, goog.events.EventTarget);
goog.addSingletonGetter(os.url.UrlManager);


/**
 * Registers a URL handler with a string matching condition. When a URL matches that condition,
 * the registered handler will be called.
 * @param {Function} handler The handler function
 * @param {string} condition The condition on which to call the handler
 */
os.url.UrlManager.prototype.registerHandler = function(handler, condition) {
  if (!this.handlers_[condition]) {
    this.handlers_[condition] = [];
  }
  this.handlers_[condition].push(handler);
};


/**
 * Registers the default file handler function for this manager. This should  handle Files.
 * @param {Function} handler The default handler function.
 */
os.url.UrlManager.prototype.registerFileHandler = function(handler) {
  this.fileHandler_ = handler;
};


/**
 * Registers the default URL handler function for this manager. This should handle URLs.
 * @param {Function} handler The default handler function.
 */
os.url.UrlManager.prototype.registerURLHandler = function(handler) {
  this.urlHandler_ = handler;
};


/**
 * Registers the default text handler function for this manager. This should handle text that is not a URL.
 * @param {Function} handler The default handler function.
 */
os.url.UrlManager.prototype.registerTextHandler = function(handler) {
  this.textHandler_ = handler;
};


/**
 * This function should be called when a URL is dropped into the page. It parses
 * the URL and looks at the array of registered handlers to determine what to do with it.
 * @param {string} url The URL to handle
 */
os.url.UrlManager.prototype.handleUrl = function(url) {
  var relativeUrl = '';
  var baseUrl = '';
  for (var base in this.handlers_) {
    if (goog.string.contains(url, base)) {
      baseUrl = base;
      base = url.slice(0, url.indexOf(base)) + base;
      relativeUrl = goog.string.remove(url, base);
    }
  }

  if (!relativeUrl.length && !baseUrl.length) {
    if (this.urlHandler_) {
      this.urlHandler_(url);
    }
    return;
  }

  if (this.handlers_[baseUrl].length == 1) {
    this.handlers_[baseUrl][0].call(this, relativeUrl);
  } else if (this.handlers_[baseUrl].length > 1) {
    var params = {};
    params = this.buildParams_(url, this.handlers_[baseUrl]);
    this.dispatchEvent(new os.url.UrlEvent(params));
  }
};


/**
 * This function should be called when text is dropped into the page. It calls the registered text handler
 * if there is one.
 * @param {string} text The text to handle
 */
os.url.UrlManager.prototype.handleText = function(text) {
  if (this.textHandler_) {
    this.textHandler_(text);
  }
};


/**
 * This function should be called when files are dropped into the page. It calls the registered file handler
 * if there is one.
 * @param {Array.<File>} files The files to handle
 */
os.url.UrlManager.prototype.handleFiles = function(files) {
  if (this.fileHandler_) {
    this.fileHandler_(files);
  }
};


/**
 * Helper function for building the parameters object that is sent with the UrlEvent.
 * @param {string} url The URL to handle
 * @param {Array.<Function>} handlers The handlers available for the url
 * @return {Object}
 * @private
 */
os.url.UrlManager.prototype.buildParams_ = function(url, handlers) {
  var params = {
    'url': url,
    'title': 'Handle URLs',
    'handlers': handlers
  };
  return params;
};

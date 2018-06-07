goog.provide('os.ui.file.method.UrlMethod');

goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.net.XhrIo');
goog.require('goog.userAgent');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.file');
goog.require('os.file.File');
goog.require('os.file.IFileMethod');
goog.require('os.net.Request');
goog.require('os.net.RequestEvent');
goog.require('os.net.RequestEventType');
goog.require('os.ui.file.urlImportDirective');
goog.require('os.ui.window');



/**
 * @implements {os.file.IFileMethod}
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.ui.file.method.UrlMethod = function() {
  os.ui.file.method.UrlMethod.base(this, 'constructor');

  /**
   * The logger
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.ui.file.method.UrlMethod.LOGGER_;

  /**
   * @type {os.file.File}
   * @private
   */
  this.file_ = null;

  /**
   * @type {os.net.Request}
   * @private
   */
  this.request_ = null;

  /**
   * @type {?string}
   * @private
   */
  this.url_ = null;
};
goog.inherits(os.ui.file.method.UrlMethod, goog.events.EventTarget);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.file.method.UrlMethod.LOGGER_ = goog.log.getLogger('os.ui.file.method.UrlMethod');


/**
 * @type {string}
 */
os.ui.file.method.UrlMethod.ID = 'urlimport';


/**
 * @inheritDoc
 */
os.ui.file.method.UrlMethod.prototype.disposeInternal = function() {
  os.ui.file.method.UrlMethod.base(this, 'disposeInternal');

  this.clearFile();

  goog.dispose(this.request_);
  this.request_ = null;
};


/**
 * @return {?string}
 */
os.ui.file.method.UrlMethod.prototype.getUrl = function() {
  return this.url_;
};


/**
 * @param {?string} value
 */
os.ui.file.method.UrlMethod.prototype.setUrl = function(value) {
  this.url_ = value;
};


/**
 * @inheritDoc
 */
os.ui.file.method.UrlMethod.prototype.getPriority = function() {
  return 0;
};


/**
 * @inheritDoc
 */
os.ui.file.method.UrlMethod.prototype.isSupported = function() {
  return true;
};


/**
 * @inheritDoc
 */
os.ui.file.method.UrlMethod.prototype.getFile = function() {
  return this.file_;
};


/**
 * @inheritDoc
 */
os.ui.file.method.UrlMethod.prototype.setFile = function(file) {
  this.file_ = file;
};


/**
 * @inheritDoc
 */
os.ui.file.method.UrlMethod.prototype.clearFile = function() {
  this.file_ = null;
};


/**
 * @inheritDoc
 */
os.ui.file.method.UrlMethod.prototype.clone = function() {
  return new this.constructor();
};


/**
 * @inheritDoc
 */
os.ui.file.method.UrlMethod.prototype.loadFile = function(opt_options) {
  this.clearFile();

  if (!this.url_) {
    var scopeOptions = {
      'method': this
    };
    var windowOptions = {
      'id': os.ui.file.method.UrlMethod.ID,
      'label': 'Import URL',
      'icon': 'fa fa-cloud-download lt-blue-icon',
      'x': 'center',
      'y': 'center',
      'width': '400',
      'min-width': '400',
      'max-width': '400',
      'height': 'auto',
      'modal': true,
      'show-close': true,
      'no-scroll': true
    };
    var template = '<urlimport></urlimport>';
    os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  } else {
    this.loadUrl();
  }
};


/**
 * Loads a file from the provided URL.
 */
os.ui.file.method.UrlMethod.prototype.loadUrl = function() {
  if (!this.url_) {
    goog.log.error(os.ui.file.method.UrlMethod.LOGGER_, 'URL cannot be null!');
    this.dispatchEvent(os.events.EventType.CANCEL);
    return;
  }

  if (this.request_) {
    this.request_.dispose();
    this.request_ = null;
  }

  // if this url contains our app, strip the app portion
  var appIndex = this.url_.lastIndexOf('?file=');
  if (appIndex != -1) {
    this.url_ = this.url_.substring(appIndex + 6);
  }

  this.request_ = new os.net.Request(this.url_);
  this.request_.setHeader('Accept', '*/*');

  if (!goog.userAgent.IE || goog.userAgent.isVersionOrHigher(10)) {
    // IE9 doesn't support arraybuffer as a response type
    this.request_.setResponseType(goog.net.XhrIo.ResponseType.ARRAY_BUFFER);
  }

  this.request_.listen(goog.net.EventType.SUCCESS, this.onLoad, false, this);
  this.request_.listen(goog.net.EventType.ERROR, this.onError, false, this);
  this.request_.load();
};


/**
 * @param {goog.events.Event} event
 * @protected
 */
os.ui.file.method.UrlMethod.prototype.onLoad = function(event) {
  var url = this.request_.getUri().toString();
  var q = url.indexOf('?');
  var i = url.lastIndexOf('/') + 1;
  var fileName = decodeURI(url.substring(i == -1 ? 0 : i, q == -1 ? url.length : q));
  var headers = this.request_.getResponseHeaders();

  // There is a header that can be used if it exists instead of the filename
  if (headers) {
    // starting with Chrome 60, all HTTP headers are lowercase, so check both to support all versions
    var contentDisposition = headers['Content-Disposition'] || headers['content-disposition'];
    if (contentDisposition) {
      // Use the value in the content-disposition ex: attachment; filename="Super Awesome Dataz.kmz"
      var re = /filename="(.*?)"/;
      var match = re.exec(contentDisposition);
      if (match && match[1]) {
        fileName = match[1];
      } else { // see if the filename was not in quotes
        var rematch = contentDisposition.split('filename=');
        if (rematch.length > 0 && rematch[1]) {
          fileName = rematch[1];
        }
      }
    }
  }

  var response = /** @type {!(ArrayBuffer|string)} */ (this.request_.getResponse());

  this.request_.dispose();
  this.request_ = null;

  this.file_ = os.file.createFromContent(fileName, url, undefined, response);
  this.dispatchEvent(os.events.EventType.COMPLETE);
  os.dispatcher.dispatchEvent(new os.net.RequestEvent(os.net.RequestEventType.USER_URL, url));
};


/**
 * @param {goog.events.Event} event
 * @protected
 */
os.ui.file.method.UrlMethod.prototype.onError = function(event) {
  var msg = '<strong>Unable to load URL "' + this.url_ + '"!</strong><br>Please check that it was entered correctly.';

  this.request_.dispose();
  this.request_ = null;

  os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.ERROR, os.ui.file.method.UrlMethod.LOGGER_);

  // notify listeners that the load failed
  this.dispatchEvent(os.events.EventType.ERROR);
};

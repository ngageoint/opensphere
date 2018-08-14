goog.provide('os.net.SameDomainHandler');

goog.require('goog.Uri');
goog.require('goog.events.Event');
goog.require('goog.events.EventLike');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.net.EventType');
goog.require('goog.net.XhrIo');
goog.require('goog.net.XhrIo.ResponseType');
goog.require('os.file.File');
goog.require('os.net.AbstractRequestHandler');
goog.require('os.net.FormEncFormatter');
goog.require('os.net.HandlerType');
goog.require('os.net.Request');



/**
 * Handles requests to the same domain with a simple XHR.
 * @constructor
 * @extends {os.net.AbstractRequestHandler}
 */
os.net.SameDomainHandler = function() {
  os.net.SameDomainHandler.base(this, 'constructor');
  this.log = os.net.SameDomainHandler.LOGGER_;

  /**
   * Set to true if the request has been successfully handled (Regardless of ERROR or SUCCESS)
   * @type {boolean}
   */
  this.handled = false;
};
goog.inherits(os.net.SameDomainHandler, os.net.AbstractRequestHandler);


/**
 * Logger
 * @type {goog.log.Logger}
 * @const
 * @private
 */
os.net.SameDomainHandler.LOGGER_ = goog.log.getLogger('os.net.SameDomainHandler');


/**
 * @inheritDoc
 */
os.net.SameDomainHandler.prototype.disposeInternal = function() {
  if (this.req) {
    this.req.dispose();
  }

  os.net.SameDomainHandler.base(this, 'disposeInternal');
};


/**
 * @inheritDoc
 */
os.net.SameDomainHandler.prototype.handles = function(method, uri) {
  if (window) {
    if (!uri.getDomain()) {
      // relative is local, so we're good
      return true;
    } else if (uri.getScheme() != os.file.FileScheme.LOCAL) {
      var local = new goog.Uri(window.location);
      return local.hasSameDomainAs(uri);
    }
  }

  return false;
};


/**
 * The request
 * @type {goog.net.XhrIo}
 * @protected
 */
os.net.SameDomainHandler.prototype.req = null;


/**
 * @inheritDoc
 */
os.net.SameDomainHandler.prototype.getResponse = function() {
  if (this.req) {
    return this.req.getResponse();
  }

  return null;
};


/**
 * @inheritDoc
 */
os.net.SameDomainHandler.prototype.getResponseHeaders = function() {
  if (this.req) {
    return this.req.getResponseHeaders();
  }

  return null;
};


/**
 * @inheritDoc
 */
os.net.SameDomainHandler.prototype.buildRequest = function() {
  this.req = new goog.net.XhrIo();
  this.req.listen(
      goog.net.EventType.SUCCESS, this.onXhrComplete, false, this);
  this.req.listen(
      goog.net.EventType.ERROR, this.onXhrError, false, this);
  this.req.listen(
      goog.net.EventType.TIMEOUT, this.onXhrError, false, this);
};


/**
 * @inheritDoc
 */
os.net.SameDomainHandler.prototype.abort = function() {
  if (this.req) {
    this.req.abort();
  }
};


/**
 * @inheritDoc
 */
os.net.SameDomainHandler.prototype.execute = function(
    method, uri, opt_headers, opt_formatter, opt_nocache, opt_responseType) {
  this.errors = null;

  if (!this.req) {
    this.buildRequest();
  }

  var payload = null;
  var headers = opt_headers;

  if (method != os.net.Request.METHOD_GET &&
      method != os.net.Request.METHOD_HEAD &&
      method != os.net.Request.METHOD_DELETE) {
    if (!opt_formatter) {
      // get default formatter
      opt_formatter = new os.net.FormEncFormatter();
    }

    payload = opt_formatter.format(uri);
    if (!headers) {
      headers = {};
    }
    if (opt_formatter.getContentType()) {
      headers['Content-Type'] = opt_formatter.getContentType();
    }
  }

  if (opt_nocache) {
    // add a cache defeater
    uri.setParameterValue('_cd', goog.now());
  }

  this.req.setResponseType(opt_responseType || goog.net.XhrIo.ResponseType.DEFAULT);
  this.req.send(this.modUri(uri), method, payload, headers);
};


/**
 * Modifies the URL once more before sending. This is mostly for extending
 * classes.
 * @param {goog.Uri|string} uri The URI
 * @return {goog.Uri|string} The modified URI
 * @protected
 */
os.net.SameDomainHandler.prototype.modUri = function(uri) {
  return uri;
};


/**
 * Handles a completed request
 * @param {goog.events.EventLike=} opt_event The event
 */
os.net.SameDomainHandler.prototype.onXhrComplete = function(opt_event) {
  this.statusCode = this.req.getStatus();
  this.dispatchEvent(goog.net.EventType.SUCCESS);
};


/**
 * Handles request errors
 * @param {goog.events.EventLike=} opt_event The event
 */
os.net.SameDomainHandler.prototype.onXhrError = function(opt_event) {
  // statuscode gets set in here:
  var msg = this.getErrorMessage(this.req);

  if (msg) {
    this.errors = [msg];
  }

  this.dispatchEvent(goog.net.EventType.ERROR);
};


/**
 * @inheritDoc
 */
os.net.SameDomainHandler.prototype.getHandlerType = function() {
  return os.net.HandlerType.SAME_DOMAIN;
};

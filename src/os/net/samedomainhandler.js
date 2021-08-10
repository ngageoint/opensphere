goog.module('os.net.SameDomainHandler');
goog.module.declareLegacyNamespace();

const Uri = goog.require('goog.Uri');
const log = goog.require('goog.log');
const EventType = goog.require('goog.net.EventType');
const XhrIo = goog.require('goog.net.XhrIo');
const ResponseType = goog.require('goog.net.XhrIo.ResponseType');
const {FileScheme} = goog.require('os.file');
const AbstractRequestHandler = goog.require('os.net.AbstractRequestHandler');
const FormEncFormatter = goog.require('os.net.FormEncFormatter');
const HandlerType = goog.require('os.net.HandlerType');
const Request = goog.require('os.net.Request');

const EventLike = goog.requireType('goog.events.EventLike');
const Logger = goog.requireType('goog.log.Logger');


/**
 * Handles requests to the same domain with a simple XHR.
 */
class SameDomainHandler extends AbstractRequestHandler {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = logger;

    /**
     * Set to true if the request has been successfully handled (Regardless of ERROR or SUCCESS)
     * @type {boolean}
     */
    this.handled = false;

    /**
     * The backing XHR.
     * @type {XhrIo}
     */
    this.req = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    if (this.req) {
      this.req.dispose();
    }

    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  handles(method, uri) {
    if (window) {
      if (!uri.getDomain()) {
        // relative is local, so we're good
        return true;
      } else if (uri.getScheme() != FileScheme.LOCAL) {
        var local = new Uri(window.location);
        return local.hasSameDomainAs(uri);
      }
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  getResponse() {
    if (this.req) {
      return this.req.getResponse();
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  getResponseHeaders() {
    if (this.req) {
      const xhrHeaders = this.req.getResponseHeaders();

      // The HTTP/2 specification lower cases all headers, and modern browsers will already have lowercase header names.
      // This ensures headers behave the same in older browsers.
      const headers = {};
      for (const key in xhrHeaders) {
        headers[key.toLowerCase()] = xhrHeaders[key];
      }

      return headers;
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  buildRequest() {
    this.req = new XhrIo();
    this.req.setTimeoutInterval(this.timeout);
    this.req.listen(
        EventType.SUCCESS, this.onXhrComplete, false, this);
    this.req.listen(
        EventType.ERROR, this.onXhrError, false, this);
    this.req.listen(
        EventType.TIMEOUT, this.onXhrError, false, this);
  }

  /**
   * @inheritDoc
   */
  abort() {
    if (this.req) {
      this.req.abort();
    }
  }

  /**
   * @inheritDoc
   */
  execute(method, uri, opt_headers, opt_formatter, opt_nocache, opt_responseType) {
    this.errors = null;

    if (!this.req) {
      this.buildRequest();
    }

    var payload = null;
    var headers = opt_headers;

    if (method != Request.METHOD_GET &&
        method != Request.METHOD_HEAD &&
        method != Request.METHOD_DELETE) {
      if (!opt_formatter) {
        // get default formatter
        opt_formatter = new FormEncFormatter();
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
      uri.setParameterValue('_cd', Date.now());
    }

    this.req.setResponseType(opt_responseType || ResponseType.DEFAULT);
    this.req.send(this.modUri(uri), method, payload, headers);
  }

  /**
   * Modifies the URL once more before sending. This is mostly for extending
   * classes.
   *
   * @param {Uri|string} uri The URI
   * @return {goog.Uri|string} The modified URI
   * @protected
   */
  modUri(uri) {
    return uri;
  }

  /**
   * Handles a completed request
   *
   * @param {EventLike=} opt_event The event
   */
  onXhrComplete(opt_event) {
    this.statusCode = this.req.getStatus();
    this.dispatchEvent(EventType.SUCCESS);
  }

  /**
   * Handles request errors
   *
   * @param {EventLike=} opt_event The event
   */
  onXhrError(opt_event) {
    // statuscode gets set in here:
    var msg = this.getErrorMessage(this.req);

    if (msg) {
      this.errors = [msg];
    }

    this.dispatchEvent(EventType.ERROR);
  }

  /**
   * @inheritDoc
   */
  getHandlerType() {
    return HandlerType.SAME_DOMAIN;
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.net.SameDomainHandler');

exports = SameDomainHandler;

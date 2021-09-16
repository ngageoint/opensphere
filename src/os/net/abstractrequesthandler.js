goog.module('os.net.AbstractRequestHandler');

const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const ErrorCode = goog.require('goog.net.ErrorCode');
const IRequestHandler = goog.require('os.net.IRequestHandler'); // eslint-disable-line

const Logger = goog.requireType('goog.log.Logger');
const XhrIo = goog.requireType('goog.net.XhrIo');


/**
 * The base class for all handlers which make an actual URL request
 *
 * @abstract
 * @implements {IRequestHandler}
 */
class AbstractRequestHandler extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The list of errors
     * @type {?Array<string>}
     * @protected
     */
    this.errors = null;

    /**
     * The logger
     * @type {Logger}
     * @protected
     */
    this.log = logger;

    /**
     * @type {number}
     * @protected
     */
    this.score = 0;

    /**
     * @type {number}
     */
    this.statusCode = -1;

    /**
     * @type {number}
     * @protected
     */
    this.timeout = 0;
  }

  /**
   * @inheritDoc
   */
  getScore() {
    return this.score;
  }

  /**
   * @inheritDoc
   */
  handles(method, uri) {
    return false;
  }

  /**
   * @inheritDoc
   */
  getErrors() {
    return this.errors;
  }

  /**
   * @inheritDoc
   */
  getStatusCode() {
    return this.statusCode;
  }

  /**
   * @abstract
   * @inheritDoc
   */
  buildRequest() {}

  /**
   * @abstract
   * @inheritDoc
   */
  getResponse() {}

  /**
   * @abstract
   * @inheritDoc
   */
  getResponseHeaders() {}

  /**
   * @abstract
   * @inheritDoc
   */
  abort() {}

  /**
   * @abstract
   * @inheritDoc
   */
  execute(method, uri, opt_headers, opt_formatter, opt_nocache, opt_responseType) {}

  /**
   * Gets a displayable error message for requests that went wrong.
   *
   * @param {XhrIo} request The failed request
   * @return {string} The error message
   */
  getErrorMessage(request) {
    // ErrorCode (not an http status code)
    var c = request.getLastErrorCode();

    var msg = null;
    if (ErrorCode.HTTP_ERROR === c) {
      // http status code
      var s = request.getStatus();
      this.statusCode = s;

      switch (true) {
        case s === 502:
          msg = 'Bad gateway.';
          break;
        case s === 503:
          msg = 'Service unavailable.';
          break;
        case s >= 500:
          msg = 'The remote server experienced an error (' + s + ').';
          break;
        case s === 401:
          // unauthorized
          msg = 'You do not have proper authorization to perform this action.';
          break;
        case s === 403:
          // forbidden
          msg = 'You do not have proper authorization to perform this action.';
          break;
        case s === 404:
          msg = 'The requested resource was not found.';
          break;
        case s >= 400:
          // we'll just say it's a bad request
          msg = 'There was an issue accessing the resource (' + s + ').';
          break;
        default:
          msg = ErrorCode.getDebugMessage(c) + '.';
          break;
      }
      log.error(this.log, msg + ' Http Status code: ' + s);
    } else {
      // This may be the best we can do...
      msg = ErrorCode.getDebugMessage(c);
      log.error(this.log, msg);
    }

    return msg;
  }

  /**
   * @inheritDoc
   */
  getHandlerType() {
    return '';
  }

  /**
   * @inheritDoc
   */
  isHandled() {
    return !!this.statusCode;
  }

  /**
   * @inheritDoc
   */
  getTimeout() {
    return this.timeout;
  }

  /**
   * @inheritDoc
   */
  setTimeout(timeout) {
    this.timeout = timeout;
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.net.AbstractRequestHandler');

exports = AbstractRequestHandler;

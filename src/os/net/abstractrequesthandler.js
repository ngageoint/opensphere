goog.provide('os.net.AbstractRequestHandler');

goog.require('goog.events.EventTarget');
goog.require('goog.net.ErrorCode');
goog.require('goog.net.XhrIo');
goog.require('os.net.IRequestHandler');



/**
 * The base class for all handlers which make an actual URL request
 * @constructor
 * @extends {goog.events.EventTarget}
 * @implements {os.net.IRequestHandler}
 */
os.net.AbstractRequestHandler = function() {
  os.net.AbstractRequestHandler.base(this, 'constructor');

  /**
   * The logger
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.net.AbstractRequestHandler.LOGGER_;

  /**
   * @type {number}
   * @protected
   */
  this.score = 0;

  /**
   * @type {number}
   */
  this.statusCode = -1;
};
goog.inherits(os.net.AbstractRequestHandler, goog.events.EventTarget);


/**
 * Logger
 * @type {goog.log.Logger}
 * @const
 * @private
 */
os.net.AbstractRequestHandler.LOGGER_ = goog.log.getLogger('os.net.AbstractRequestHandler');


/**
 * @inheritDoc
 */
os.net.AbstractRequestHandler.prototype.getScore = function() {
  return this.score;
};


/**
 * The list of errors
 * @type {?Array.<string>}
 * @protected
 */
os.net.AbstractRequestHandler.prototype.errors = null;


/**
 * @inheritDoc
 */
os.net.AbstractRequestHandler.prototype.handles = function(method, uri) {
  return false;
};


/**
 * @inheritDoc
 */
os.net.AbstractRequestHandler.prototype.getErrors = function() {
  return this.errors;
};


/**
 * @inheritDoc
 */
os.net.AbstractRequestHandler.prototype.getStatusCode = function() {
  return this.statusCode;
};


/**
 * @inheritDoc
 */
os.net.AbstractRequestHandler.prototype.buildRequest = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.net.AbstractRequestHandler.prototype.getResponse = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.net.AbstractRequestHandler.prototype.getResponseHeaders = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.net.AbstractRequestHandler.prototype.abort = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.net.AbstractRequestHandler.prototype.execute = goog.abstractMethod;


/**
 * Gets a displayable error message for requests that went wrong.
 * @param {goog.net.XhrIo} request The failed request
 * @return {string} The error message
 */
os.net.AbstractRequestHandler.prototype.getErrorMessage = function(request) {
  // goog.net.ErrorCode (not an http status code)
  var c = request.getLastErrorCode();

  var msg = null;
  if (goog.net.ErrorCode.HTTP_ERROR === c) {
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
      case s === 400:
        msg = 'Bad request.';
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
        msg = goog.net.ErrorCode.getDebugMessage(c) + '.';
        break;
    }
    goog.log.error(this.log, msg + ' Http Status code: ' + s);
  } else {
    // This may be the best we can do...
    msg = goog.net.ErrorCode.getDebugMessage(c);
    goog.log.error(this.log, msg);
  }

  return msg;
};


/**
 * @inheritDoc
 */
os.net.AbstractRequestHandler.prototype.getHandlerType = function() {
  return '';
};


/**
 * @inheritDoc
 */
os.net.AbstractRequestHandler.prototype.isHandled = function() {
  return !!this.statusCode;
};

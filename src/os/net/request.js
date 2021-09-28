goog.declareModuleId('os.net.Request');

import * as dispatcher from '../dispatcher.js';
import {getDefaultValidators} from './net.js';
import RequestEvent from './requestevent.js';
import RequestEventType from './requesteventtype.js';
import * as RequestHandlerFactory from './requesthandlerfactory.js';
import URLModifier from './urlmodifier.js';
import VariableReplacer from './variablereplacer.js';

const Promise = goog.require('goog.Promise');
const Uri = goog.require('goog.Uri');
const {binaryInsert, binaryRemove, defaultCompare} = goog.require('goog.array');
const EventTarget = goog.require('goog.events.EventTarget');
const log = goog.require('goog.log');
const Level = goog.require('goog.log.Level');
const EventType = goog.require('goog.net.EventType');

const GoogEvent = goog.requireType('goog.events.Event');
const EventLike = goog.requireType('goog.events.EventLike');
const Logger = goog.requireType('goog.log.Logger');
const ResponseType = goog.requireType('goog.net.XhrIo.ResponseType');
const {RequestValidator} = goog.requireType('os.net');
const {default: IDataFormatter} = goog.requireType('os.net.IDataFormatter');
const {default: IModifier} = goog.requireType('os.net.IModifier');
const {default: IRequestHandler} = goog.requireType('os.net.IRequestHandler');


/**
 * A request class that runs modifiers and data formatters before submitting
 * the request. Multiple <code>RequestHandler</code> implementations can
 * be registered with the <code>RequestHandlerFactory</code> to determine
 * how the requests are retrieved.
 */
export default class Request extends EventTarget {
  /**
   * Constructor.
   * @param {Uri|string=} opt_uri The uri
   * @param {string=} opt_method The request method
   * @param {number=} opt_timeout Request timeout
   */
  constructor(opt_uri, opt_method, opt_timeout) {
    super();

    /**
     * The request method
     * @type {string}
     * @private
     */
    this.method_ = Request.METHOD_GET;

    /**
     * The URI
     * @private
     * @type {Uri}
     */
    this.uri_ = null;

    /**
     * The request headers
     * @private
     * @type {?Object<string, string>}
     */
    this.headers_ = null;

    /**
     * The modifier list
     * @type {?Array<IModifier>}
     * @private
     */
    this.modifiers_ = null;

    /**
     * The data formatter. If the request sends a payload, this will format the
     * supplied data into the desired payload structure (XML, JSON, ... etc.).
     * @type {IDataFormatter}
     * @private
     */
    this.dataFormatter_ = null;

    /**
     * The response
     * @private
     * @type {*}
     */
    this.response_ = null;

    /**
     * The response headers
     * @type {?Object<string, string>}
     * @private
     */
    this.responseHeaders_ = null;

    /**
     * The response type
     * @private
     * @type {?ResponseType}
     */
    this.responseType_ = null;

    /**
     * The set of handlers last retrieved for the URI
     * @type {?Array<IRequestHandler>}
     * @private
     */
    this.handlers_ = null;

    /**
     * The modified URI
     * @type {Uri}
     * @private
     */
    this.modUri_ = null;

    /**
     * The sets of errors from the handlers
     * @type {Array<string>}
     * @private
     */
    this.errors_ = null;

    /**
     * The sets of status codes from the handlers
     * @type {Array<number>}
     * @private
     */
    this.statusCodes_ = null;

    /**
     * Whether or not the current request has toggled nocache
     * @type {boolean}
     * @private
     */
    this.nocache_ = false;

    /**
     * The current handler that we're trying
     * @type {IRequestHandler}
     * @private
     */
    this.handler_ = null;

    /**
     * The validator function for the response.
     * @type {?RequestValidator}
     * @private
     */
    this.validator_ = null;

    /**
     * If default validators should be used to detect errors in the response.
     * @type {boolean}
     * @private
     */
    this.useDefaultValidators_ = false;

    /**
     * Type of the handler that completed the request.
     * @type {?string}
     * @private
     */
    this.successfulHandlerType_ = null;

    /**
     * Request timeout in milliseconds
     * @type {number}
     * @private
     */
    this.timeout_ = opt_timeout || 0;

    /**
     * The default log level.
     * @type {!Level}
     * @private
     */
    this.logLevel_ = Level.INFO;

    if (opt_uri) {
      this.setUri(opt_uri);
    }

    if (opt_method) {
      this.setMethod(opt_method);
    }

    this.addModifier(new VariableReplacer());
    this.addModifier(new URLModifier());
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.abort();
    this.clearResponse();

    super.disposeInternal();
  }

  /**
   * Gets the URI
   *
   * @return {Uri} The URI
   */
  getUri() {
    return this.uri_;
  }

  /**
   * Sets the URI
   *
   * @param {Uri|string} uri The URI
   */
  setUri(uri) {
    if (typeof uri == 'string') {
      this.uri_ = new Uri(uri);
    } else {
      this.uri_ = uri;
    }
  }

  /**
   * Gets the value for the given header, or <code>null</code> if it could not be
   * found.
   *
   * @param {string} header The header to find
   * @return {?string} The value for the given header, or <code>null</code> if it
   * could not be found
   */
  getHeader(header) {
    if (this.headers_) {
      /** @type {string} */
      var l = header.toLowerCase();

      for (var h in this.headers_) {
        if (h.toLowerCase() == l) {
          return this.headers_[h];
        }
      }
    }

    return null;
  }

  /**
   * Sets the value for the given header
   *
   * @param {string} header The header
   * @param {string} value The value
   */
  setHeader(header, value) {
    if (!this.headers_) {
      this.headers_ = {};
    }

    this.headers_[header] = value;
  }

  /**
   * Gets the map of headers
   *
   * @return {?Object<string, string>} The header map
   */
  getHeaders() {
    return this.headers_;
  }

  /**
   * Sets the map of headers
   *
   * @param {?Object<string, string>} headers The header map
   */
  setHeaders(headers) {
    this.headers_ = headers;
  }

  /**
   * Adds a modifier to the list. Modifiers are executed in the order of their
   * priority (highest to lowest). Modifiers with the same priority are sorted
   * by ID.
   *
   * @param {IModifier} modifier The modifier to add
   * @throws {Error} If a modifier with the same ID already exists in the list
   */
  addModifier(modifier) {
    if (this.modifiers_ === null) {
      this.modifiers_ = [modifier];
    } else {
      for (var i = 0, n = this.modifiers_.length; i < n; i++) {
        if (this.modifiers_[i].getId() == modifier.getId()) {
          throw new Error('A modifier with the id "' + modifier.getId() +
              '" already exists in the set!');
        }
      }

      binaryInsert(
          this.modifiers_,
          modifier,
          Request.modifierCompare_);
    }
  }

  /**
   * Removes a modifier from the list.
   *
   * @param {IModifier|string} modifier The modifier or modifier ID to
   * remove.
   */
  removeModifier(modifier) {
    if (this.modifiers_) {
      if (typeof modifier == 'string') {
        for (var i = 0, n = this.modifiers_.length; i < n; i++) {
          var m = this.modifiers_[i];

          if (m.getId() == modifier) {
            this.modifiers_.splice(i, 1);
            break;
          }
        }
      } else {
        binaryRemove(
            this.modifiers_,
            /** @type {IModifier} */ (modifier),
            Request.modifierCompare_);
      }
    }
  }

  /**
   * Returns a copy of the modifiers
   *
   * @return {?Array<IModifier>}
   */
  getModifiers() {
    return this.modifiers_ ? this.modifiers_.slice() : null;
  }

  /**
   * Gets the data formatter. If the request sends a payload, the data formatter
   * will format the supplied data into the desired payload structure (XML
   * , JSON, ... etc.).
   *
   * @return {IDataFormatter}
   */
  getDataFormatter() {
    return this.dataFormatter_;
  }

  /**
   * Sets the data formatter. If the request sends a payload, the data formatter
   * will format the supplied data into the desired payload structure (XML
   * , JSON, ... etc.).
   *
   * @param {IDataFormatter} value The data formatter to use for the
   * request
   */
  setDataFormatter(value) {
    this.dataFormatter_ = value;
  }

  /**
   * Gets the reqeuest method.
   *
   * @return {string} The request method
   */
  getMethod() {
    return this.method_;
  }

  /**
   * Sets the request method.
   *
   * @param {string} value The request method
   */
  setMethod(value) {
    this.method_ = value;
  }

  /**
   * Gets the response
   *
   * @return {*} The response
   */
  getResponse() {
    return this.response_;
  }

  /**
   * Gets the response headers
   *
   * @return {?Object<string, string>}
   */
  getResponseHeaders() {
    return this.responseHeaders_;
  }

  /**
   * Clears the response
   */
  clearResponse() {
    this.response_ = null;
    this.responseHeaders_ = null;
  }

  /**
   * Gets the response type
   *
   * @return {?ResponseType} The response type
   */
  getResponseType() {
    return this.responseType_;
  }

  /**
   * Sets the response type
   *
   * @param {?ResponseType} responseType The response type
   */
  setResponseType(responseType) {
    this.responseType_ = responseType;
  }

  /**
   * @return {?RequestValidator} The response validator function
   */
  getValidator() {
    return this.validator_;
  }

  /**
   * Sets the response validator function
   *
   * @param {?RequestValidator} value The function
   */
  setValidator(value) {
    this.validator_ = value;
  }

  /**
   * If the request will use default validators on the response.
   * @return {boolean}
   */
  getUseDefaultValidators() {
    return this.useDefaultValidators_;
  }

  /**
   * Set if the request will use default validators on the response.
   * @param {boolean} value The value.
   */
  setUseDefaultValidators(value) {
    this.useDefaultValidators_ = value;
  }

  /**
   * The sets of errors from the handlers
   *
   * @return {Array<string>}
   */
  getErrors() {
    return this.errors_;
  }

  /**
   * The array of status codes from the handlers
   *
   * @return {Array<number>}
   */
  getStatusCodes() {
    return this.statusCodes_;
  }

  /**
   * Returns the successful handler type.
   *
   * @return {?string}
   */
  getSuccessfulHandlerType() {
    return this.successfulHandlerType_;
  }

  /**
   * Cancels the request and cleans up handlers.
   */
  abort() {
    if (this.handler_) {
      this.removeHandlerListeners(this.handler_);
      this.handler_.abort();
      this.handlerCleanup_();
    }

    this.dispatchEvent(EventType.ABORT);
  }

  /**
   * Initiates loading the request and returns a {@link Promise} that will
   * resolve to the response value. Rejection values are generally an array of
   * string errors.
   *
   * @return {goog.Promise} resolving to the response body of the request
   */
  getPromise() {
    var that = this;
    var listener = null;

    return new Promise(function(resolve, reject) {
      /**
       * request listener to finish promise
       *
       * @param {GoogEvent} evt
       */
      listener = function(evt) {
        if (listener) {
          that.unlisten(EventType.SUCCESS, listener);
          that.unlisten(EventType.ERROR, listener);
          that.unlisten(EventType.ABORT, listener);
        }

        if (evt.type === EventType.SUCCESS) {
          resolve(that.getResponse());
        } else {
          reject(that.getErrors());
        }
      };

      that.listen(EventType.SUCCESS, listener);
      that.listen(EventType.ERROR, listener);
      that.listen(EventType.ABORT, listener);
      that.load();
    }).thenCatch(function(err) {
      // abort the request if the promise is cancelled
      if (listener && err instanceof Promise.CancellationError) {
        that.unlisten(EventType.SUCCESS, listener);
        that.unlisten(EventType.ERROR, listener);
        that.unlisten(EventType.ABORT, listener);
        that.abort();
        err = that.getErrors();
      }

      // continue on catching
      throw err;
    });
  }

  /**
   * Retrieves the request
   *
   * @param {boolean=} opt_nocache Tells the handlers not to use the cache
   * @throws An error if URI isn't set or trying to run modifiers on a read-only URI or if no handlers could be found
   *     to handle the URI.
   */
  load(opt_nocache) {
    var mU = this.getUri();
    this.modUri_ = null;
    this.response_ = null;
    this.responseHeaders_ = null;
    this.errors_ = null;
    this.nocache_ = Boolean(opt_nocache);

    if (mU) {
      // we'll work with a clone of the URI
      var u = mU.clone();

      if (this.modifiers_) {
        // Throw an error if we are about to run modifiers on a read-only URI.
        // Note that the cloned URI doesn't include the read-only flag, so we'll
        // call enforceReadOnly() on the original URI
        mU.enforceReadOnly();

        // run the modifiers
        for (var i = 0, n = this.modifiers_.length; i < n; i++) {
          this.modifiers_[i].modify(u);
        }
      }

      this.modUri_ = u;

      dispatcher.getInstance().dispatchEvent(new RequestEvent(
          RequestEventType.TRY_URL, this.modUri_.toString()));

      // get a set of handlers for the URI
      this.handlers_ = RequestHandlerFactory.getHandlers(
          this.getMethod(), u, this.timeout_);

      if (this.handlers_ && this.handlers_.length) {
        log.log(logger, this.logLevel_,
            (this.nocache_ ? 'NOCACHE ' : '') + this.getMethod() + ' ' + u);
        this.executeHandlers_();
      } else {
        var msg = 'No handlers were found for URI: ' + u;
        log.error(logger, msg);
        throw new Error(msg);
      }
    } else {
      var msg = 'No URI set for request!';
      log.error(logger, msg);
      throw new Error(msg);
    }
  }

  /**
   * Tries the next handler
   *
   * @private
   */
  executeHandlers_() {
    if (this.handlers_ && this.handlers_.length) {
      if (this.handler_) {
        // stop listening
        this.removeHandlerListeners(this.handler_);
      }

      this.handler_ = this.handlers_.shift();

      // start listening
      this.addHandlerListeners(this.handler_);

      // execute the handler. make a clone of the URI in case the handler/formatter/etc make modifications.
      this.handler_.execute(
          this.getMethod(),
          this.modUri_.clone(),
          this.headers_,
          this.getDataFormatter(),
          this.nocache_,
          this.responseType_);
    }
  }

  /**
   * Adds event listeners to the request handler
   *
   * @param {IRequestHandler} handler The handler
   */
  addHandlerListeners(handler) {
    handler.listen(EventType.SUCCESS, this.onHandlerComplete_, false, this);
    handler.listen(EventType.ERROR, this.onHandlerError_, false, this);
  }

  /**
   * Removes event listeners from the request handler
   *
   * @param {IRequestHandler} handler The handler
   */
  removeHandlerListeners(handler) {
    handler.unlisten(EventType.SUCCESS, this.onHandlerComplete_, false, this);
    handler.unlisten(EventType.ERROR, this.onHandlerError_, false, this);
  }

  /**
   * Handles handler completion
   *
   * @param {EventLike=} opt_event The event
   * @private
   */
  onHandlerComplete_(opt_event) {
    this.response_ = this.handler_.getResponse();
    this.responseHeaders_ = this.handler_.getResponseHeaders();
    this.successfulHandlerType_ = this.handler_.getHandlerType();

    if (!this.statusCodes_) {
      this.statusCodes_ = [];
    }
    this.statusCodes_.push(this.handler_.getStatusCode());

    if (this.response_) {
      var contentType = this.responseHeaders_ ? this.responseHeaders_['content-type'] : undefined;
      var error = this.validateResponse_(/** @type {ArrayBuffer|string} */ (this.response_), contentType);
      if (error) {
        this.addError_(error);
      }
    }

    this.handlerCleanup_();

    if (error) {
      log.error(logger, error);
      this.dispatchEvent(EventType.ERROR);
    } else {
      this.dispatchEvent(EventType.SUCCESS);
    }
  }

  /**
   * @param {?string} err The error message to add
   * @private
   */
  addError_(err) {
    if (err) {
      if (!this.errors_) {
        this.errors_ = [];
      }

      this.errors_.push(err);
    }
  }

  /**
   * Handles handler errors
   *
   * @param {EventLike=} opt_event The event
   * @private
   */
  onHandlerError_(opt_event) {
    this.response_ = this.handler_.getResponse();
    this.responseHeaders_ = this.handler_.getResponseHeaders();
    if (!this.statusCodes_) {
      this.statusCodes_ = [];
    }

    this.statusCodes_.push(this.handler_.getStatusCode());

    // Try to get the specific error using the validator(s), otherwise use the response error.
    var contentType = this.responseHeaders_ ? this.responseHeaders_['content-type'] : null;
    var error = this.validateResponse_(/** @type {ArrayBuffer|string} */ (this.response_), contentType);
    if (error) {
      this.addError_(error);
    } else {
      var errors = this.handler_.getErrors();
      if (errors) {
        errors.forEach(this.addError_, this);
      }
    }

    if (this.handlers_ && this.handlers_.length && !this.handler_.isHandled()) {
      this.executeHandlers_();
    } else {
      // we've tried all the handlers and none of them worked
      var msg = 'Error! See fine log for more details. ' + this.modUri_;
      log.error(logger, msg);
      this.handlerCleanup_();
      this.dispatchEvent(EventType.ERROR);
    }
  }

  /**
   * Cleanup handlers
   *
   * @private
   */
  handlerCleanup_() {
    if (this.handler_) {
      this.removeHandlerListeners(this.handler_);
      this.handler_.dispose();
    }

    this.handler_ = null;
    this.handlers_ = null;
  }

  /**
   * Run validators against a response.
   * @param {string|ArrayBuffer} response The response.
   * @param {?string=} opt_contentType The content type.
   * @return {?string} The error message, or null if the response is valid.
   * @private
   */
  validateResponse_(response, opt_contentType) {
    var error = null;

    if (this.validator_) {
      error = this.validator_(response, opt_contentType, this.statusCodes_);
    }

    if (!error && this.useDefaultValidators_) {
      var validators = getDefaultValidators();
      for (var i = 0; i < validators.length && !error; i++) {
        error = validators[i](response, opt_contentType, this.statusCodes_);
      }
    }

    return error || null;
  }

  /**
   * Gets the request timeout in milliseconds, 0 for indefinite, default.
   *
   * @return {number}
   */
  getTimeout() {
    return this.timeout_;
  }

  /**
   * Sets the request timeout in milliseconds, 0 for indefinite, default.
   *
   * @param {number} timeout
   */
  setTimeout(timeout) {
    this.timeout_ = timeout;
  }

  /**
   * Gets the default log level for the request.
   *
   * @return {!Level}
   */
  getLogLevel() {
    return this.logLevel_;
  }

  /**
   * Sets the default log level for the request.
   *
   * @param {!Level} level The log level.
   */
  setLogLevel(level) {
    this.logLevel_ = level;
  }

  /**
   * Gets the modified URI
   *
   * @return {Uri}
   */
  getModUri() {
    return this.modUri_;
  }

  /**
   * Static compare function for sorting the modifiers list.
   *
   * @param {IModifier} a
   * @param {os.net.IModifier} b
   * @return {number} The compare result
   * @private
   */
  static modifierCompare_(a, b) {
    var r = defaultCompare(a.getPriority(), b.getPriority());

    if (r === 0) {
      return defaultCompare(a.getId(), b.getId());
    } else {
      return -r;
    }
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.net.Request');

/**
 * The GET method
 * @const
 * @type {string}
 */
Request.METHOD_GET = 'GET';

/**
 * The POST method
 * @const
 * @type {string}
 */
Request.METHOD_POST = 'POST';

/**
 * The PUT method
 * @const
 * @type {string}
 */
Request.METHOD_PUT = 'PUT';

/**
 * The DELETE method
 * @const
 * @type {string}
 */
Request.METHOD_DELETE = 'DELETE';

/**
 * The HEAD method
 * @const
 * @type {string}
 */
Request.METHOD_HEAD = 'HEAD';

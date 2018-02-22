goog.provide('os.net.Request');

goog.require('goog.Promise');
goog.require('goog.Uri');
goog.require('goog.array');
goog.require('goog.events.Event');
goog.require('goog.events.EventLike');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.net.EventType');
goog.require('os');
goog.require('os.net.IDataFormatter');
goog.require('os.net.IModifier');
goog.require('os.net.IRequestHandler');
goog.require('os.net.RequestEvent');
goog.require('os.net.RequestEventType');
goog.require('os.net.RequestHandlerFactory');
goog.require('os.net.URLModifier');
goog.require('os.net.VariableReplacer');



/**
 * A request class that runs modifiers and data formatters before submitting
 * the request. Multiple <code>RequestHandler</code> implementations can
 * be registered with the <code>RequestHandlerFactory</code> to determine
 * how the requests are retrieved.
 * @extends {goog.events.EventTarget}
 * @param {goog.Uri|string=} opt_uri The uri
 * @param {string=} opt_method The request method
 * @constructor
 */
os.net.Request = function(opt_uri, opt_method) {
  os.net.Request.base(this, 'constructor');

  /**
   * The URI
   * @private
   * @type {goog.Uri}
   */
  this.uri_ = null;

  /**
   * The request headers
   * @private
   * @type {?Object.<string, string>}
   */
  this.headers_ = null;

  /**
   * The modifier list
   * @type {?Array.<os.net.IModifier>}
   * @private
   */
  this.modifiers_ = null;

  /**
   * The data formatter. If the request sends a payload, this will format the
   * supplied data into the desired payload structure (XML, JSON, ... etc.).
   * @type {os.net.IDataFormatter}
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
   * @type {?Object.<string, string>}
   * @private
   */
  this.responseHeaders_ = null;

  /**
   * The response type
   * @private
   * @type {?goog.net.XhrIo.ResponseType}
   */
  this.responseType_ = null;

  /**
   * The set of handlers last retrieved for the URI
   * @type {?Array.<os.net.IRequestHandler>}
   * @private
   */
  this.handlers_ = null;

  /**
   * The modified URI
   * @type {goog.Uri}
   * @private
   */
  this.modUri_ = null;

  /**
   * The sets of errors from the handlers
   * @type {Array.<string>}
   * @private
   */
  this.errors_ = null;

  /**
   * The sets of status codes from the handlers
   * @type {Array.<number>}
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
   * @type {os.net.IRequestHandler}
   * @private
   */
  this.handler_ = null;

  /**
   * The validator function for the response.
   * @type {?function((ArrayBuffer|string), ?string):?string}
   * @private
   */
  this.validator_ = null;

  /**
   * Type of the handler that completed the request.
   * @type {?string}
   * @private
   */
  this.successfulHandlerType_ = null;

  if (opt_uri) {
    this.setUri(opt_uri);
  }

  if (opt_method) {
    this.setMethod(opt_method);
  }

  this.addModifier(new os.net.VariableReplacer());
  this.addModifier(new os.net.URLModifier());
};
goog.inherits(os.net.Request, goog.events.EventTarget);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.net.Request.LOGGER_ = goog.log.getLogger('os.net.Request');


/**
 * The GET method
 * @const
 * @type {string}
 */
os.net.Request.METHOD_GET = 'GET';


/**
 * The POST method
 * @const
 * @type {string}
 */
os.net.Request.METHOD_POST = 'POST';


/**
 * The PUT method
 * @const
 * @type {string}
 */
os.net.Request.METHOD_PUT = 'PUT';


/**
 * The DELETE method
 * @const
 * @type {string}
 */
os.net.Request.METHOD_DELETE = 'DELETE';


/**
 * The HEAD method
 * @const
 * @type {string}
 */
os.net.Request.METHOD_HEAD = 'HEAD';


/**
 * @inheritDoc
 */
os.net.Request.prototype.disposeInternal = function() {
  this.abort();
  this.clearResponse();

  os.net.Request.base(this, 'disposeInternal');
};


/**
 * Gets the URI
 * @return {goog.Uri} The URI
 */
os.net.Request.prototype.getUri = function() {
  return this.uri_;
};


/**
 * Sets the URI
 * @param {goog.Uri|string} uri The URI
 */
os.net.Request.prototype.setUri = function(uri) {
  if (typeof uri == 'string') {
    this.uri_ = new goog.Uri(uri);
  } else {
    this.uri_ = uri;
  }
};


/**
 * Gets the value for the given header, or <code>null</code> if it could not be
 * found.
 * @param {string} header The header to find
 * @return {?string} The value for the given header, or <code>null</code> if it
 * could not be found
 */
os.net.Request.prototype.getHeader = function(header) {
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
};


/**
 * Sets the value for the given header
 * @param {string} header The header
 * @param {string} value The value
 */
os.net.Request.prototype.setHeader = function(header, value) {
  if (!this.headers_) {
    this.headers_ = {};
  }

  this.headers_[header] = value;
};


/**
 * Gets the map of headers
 * @return {?Object.<string, string>} The header map
 */
os.net.Request.prototype.getHeaders = function() {
  return this.headers_;
};


/**
 * Sets the map of headers
 * @param {?Object.<string, string>} headers The header map
 */
os.net.Request.prototype.setHeaders = function(headers) {
  this.headers_ = headers;
};


/**
 * Adds a modifier to the list. Modifiers are executed in the order of their
 * priority (highest to lowest). Modifiers with the same priority are sorted
 * by ID.
 * @param {os.net.IModifier} modifier The modifier to add
 * @throws {Error} If a modifier with the same ID already exists in the list
 */
os.net.Request.prototype.addModifier = function(modifier) {
  if (this.modifiers_ === null) {
    this.modifiers_ = [modifier];
  } else {
    for (var i = 0, n = this.modifiers_.length; i < n; i++) {
      if (this.modifiers_[i].getId() == modifier.getId()) {
        throw new Error('A modifier with the id "' + modifier.getId() +
            '" already exists in the set!');
      }
    }

    goog.array.binaryInsert(
        this.modifiers_,
        modifier,
        os.net.Request.modifierCompare_);
  }
};


/**
 * Removes a modifier from the list.
 * @param {os.net.IModifier|string} modifier The modifier or modifier ID to
 * remove.
 */
os.net.Request.prototype.removeModifier = function(modifier) {
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
      goog.array.binaryRemove(
          this.modifiers_,
          /** @type {os.net.IModifier} */ (modifier),
          os.net.Request.modifierCompare_);
    }
  }
};


/**
 * Static compare function for sorting the modifiers list.
 * @param {os.net.IModifier} a
 * @param {os.net.IModifier} b
 * @return {number} The compare result
 * @private
 */
os.net.Request.modifierCompare_ = function(a, b) {
  var r = goog.array.defaultCompare(a.getPriority(), b.getPriority());

  if (r === 0) {
    return goog.array.defaultCompare(a.getId(), b.getId());
  } else {
    return -r;
  }
};


/**
 * Gets the data formatter. If the request sends a payload, the data formatter
 * will format the supplied data into the desired payload structure (XML
 * , JSON, ... etc.).
 * @return {os.net.IDataFormatter}
 */
os.net.Request.prototype.getDataFormatter = function() {
  return this.dataFormatter_;
};


/**
 * Sets the data formatter. If the request sends a payload, the data formatter
 * will format the supplied data into the desired payload structure (XML
 * , JSON, ... etc.).
 * @param {os.net.IDataFormatter} value The data formatter to use for the
 * request
 */
os.net.Request.prototype.setDataFormatter = function(value) {
  this.dataFormatter_ = value;
};


/**
 * The request method
 * @type {string}
 * @private
 */
os.net.Request.prototype.method_ = os.net.Request.METHOD_GET;


/**
 * Gets the reqeuest method.
 * @return {string} The request method
 */
os.net.Request.prototype.getMethod = function() {
  return this.method_;
};


/**
 * Sets the request method.
 * @param {string} value The request method
 */
os.net.Request.prototype.setMethod = function(value) {
  this.method_ = value;
};


/**
 * Gets the response
 * @return {*} The response
 */
os.net.Request.prototype.getResponse = function() {
  return this.response_;
};


/**
 * Gets the response headers
 * @return {?Object.<string, string>}
 */
os.net.Request.prototype.getResponseHeaders = function() {
  return this.responseHeaders_;
};


/**
 * Clears the response
 */
os.net.Request.prototype.clearResponse = function() {
  this.response_ = null;
  this.responseHeaders_ = null;
};


/**
 * Gets the response type
 * @return {?goog.net.XhrIo.ResponseType} The response type
 */
os.net.Request.prototype.getResponseType = function() {
  return this.responseType_;
};


/**
 * Sets the response type
 * @param {?goog.net.XhrIo.ResponseType} responseType The response type
 */
os.net.Request.prototype.setResponseType = function(responseType) {
  this.responseType_ = responseType;
};


/**
 * @return {?function((ArrayBuffer|string), ?string):?string} The response validator function
 */
os.net.Request.prototype.getValidator = function() {
  return this.validator_;
};


/**
 * Sets the response validator function
 * @param {?function((ArrayBuffer|string)):?string} value The function
 */
os.net.Request.prototype.setValidator = function(value) {
  this.validator_ = value;
};


/**
 * The sets of errors from the handlers
 * @return {Array.<string>}
 */
os.net.Request.prototype.getErrors = function() {
  return this.errors_;
};


/**
 * The array of status codes from the handlers
 * @return {Array.<number>}
 */
os.net.Request.prototype.getStatusCodes = function() {
  return this.statusCodes_;
};


/**
 * Returns the successful handler type.
 * @return {?string}
 */
os.net.Request.prototype.getSuccessfulHandlerType = function() {
  return this.successfulHandlerType_;
};


/**
 * Cancels the request and cleans up handlers.
 */
os.net.Request.prototype.abort = function() {
  if (this.handler_) {
    this.removeHandlerListeners(this.handler_);
    this.handler_.abort();
    this.handlerCleanup_();
  }

  this.dispatchEvent(goog.net.EventType.ABORT);
};


/**
 * Initiates loading the request and returns a {@link goog.Promise} that will
 * resolve to the response value. Rejection values are generally an array of
 * string errors.
 *
 * @return {goog.Promise} resolving to the response body of the request
 */
os.net.Request.prototype.getPromise = function() {
  var that = this;
  var listener = null;

  return new goog.Promise(function(resolve, reject) {
    /**
     * request listener to finish promise
     * @param {goog.events.Event} evt
     */
    listener = function(evt) {
      if (listener) {
        that.unlisten(goog.net.EventType.SUCCESS, listener);
        that.unlisten(goog.net.EventType.ERROR, listener);
        that.unlisten(goog.net.EventType.ABORT, listener);
      }

      if (evt.type === goog.net.EventType.SUCCESS) {
        resolve(that.getResponse());
      } else {
        reject(that.getErrors());
      }
    };

    that.listen(goog.net.EventType.SUCCESS, listener);
    that.listen(goog.net.EventType.ERROR, listener);
    that.listen(goog.net.EventType.ABORT, listener);
    that.load();
  }).thenCatch(function(err) {
    // abort the request if the promise is cancelled
    if (listener && err instanceof goog.Promise.CancellationError) {
      that.unlisten(goog.net.EventType.SUCCESS, listener);
      that.unlisten(goog.net.EventType.ERROR, listener);
      that.unlisten(goog.net.EventType.ABORT, listener);
      that.abort();
      err = that.getErrors();
    }

    // continue on catching
    throw err;
  });
};


/**
 * Retrieves the request
 * @param {boolean=} opt_nocache Tells the handlers not to use the cache
 * @throws An error if URI isn't set or trying to run modifiers on a read-only URI or if no handlers could be found
 *     to handle the URI.
 */
os.net.Request.prototype.load = function(opt_nocache) {
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

    os.dispatcher.dispatchEvent(new os.net.RequestEvent(
        os.net.RequestEventType.TRY_URL, this.modUri_.toString()));

    // get a set of handlers for the URI
    this.handlers_ = os.net.RequestHandlerFactory.getHandlers(
        this.getMethod(), u);

    if (this.handlers_ && this.handlers_.length) {
      goog.log.info(os.net.Request.LOGGER_,
          (this.nocache_ ? 'NOCACHE ' : '') + this.getMethod() + ' ' + u);
      this.executeHandlers_();
    } else {
      var msg = 'No handlers were found for URI: ' + u;
      goog.log.error(os.net.Request.LOGGER_, msg);
      throw new Error(msg);
    }
  } else {
    var msg = 'No URI set for request!';
    goog.log.error(os.net.Request.LOGGER_, msg);
    throw new Error(msg);
  }
};


/**
 * Tries the next handler
 * @private
 */
os.net.Request.prototype.executeHandlers_ = function() {
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
};


/**
 * Adds event listeners to the request handler
 * @param {os.net.IRequestHandler} handler The handler
 */
os.net.Request.prototype.addHandlerListeners = function(handler) {
  handler.listen(goog.net.EventType.SUCCESS, this.onHandlerComplete_, false, this);
  handler.listen(goog.net.EventType.ERROR, this.onHandlerError_, false, this);
};


/**
 * Removes event listeners from the request handler
 * @param {os.net.IRequestHandler} handler The handler
 */
os.net.Request.prototype.removeHandlerListeners = function(handler) {
  handler.unlisten(goog.net.EventType.SUCCESS, this.onHandlerComplete_);
  handler.unlisten(goog.net.EventType.ERROR, this.onHandlerError_);
};


/**
 * Handles handler completion
 * @param {goog.events.EventLike=} opt_event The event
 * @private
 */
os.net.Request.prototype.onHandlerComplete_ = function(opt_event) {
  this.response_ = this.handler_.getResponse();
  this.responseHeaders_ = this.handler_.getResponseHeaders();
  this.successfulHandlerType_ = this.handler_.getHandlerType();

  if (!this.statusCodes_) {
    this.statusCodes_ = [];
  }
  this.statusCodes_.push(this.handler_.getStatusCode());

  if (this.response_ && this.validator_) {
    var error = this.validator_(/** @type {ArrayBuffer|string} */ (this.response_),
        this.responseHeaders_['Content-Type']);

    this.addError_(error);
  }

  this.handlerCleanup_();

  if (error) {
    goog.log.error(os.net.Request.LOGGER_, error);
    this.dispatchEvent(goog.net.EventType.ERROR);
  } else {
    this.dispatchEvent(goog.net.EventType.SUCCESS);
  }
};


/**
 * @param {?string} err The error message to add
 * @private
 */
os.net.Request.prototype.addError_ = function(err) {
  if (err) {
    if (!this.errors_) {
      this.errors_ = [];
    }

    this.errors_.push(err);
  }
};


/**
 * Handles handler errors
 * @param {goog.events.EventLike=} opt_event The event
 * @private
 */
os.net.Request.prototype.onHandlerError_ = function(opt_event) {
  this.response_ = this.handler_.getResponse();
  this.responseHeaders_ = this.handler_.getResponseHeaders();
  if (!this.statusCodes_) {
    this.statusCodes_ = [];
  }

  var errors = this.handler_.getErrors();
  if (errors) {
    errors.forEach(this.addError_, this);
  }

  this.statusCodes_.push(this.handler_.getStatusCode());

  if (this.handlers_ && this.handlers_.length && !this.handler_.isHandled()) {
    this.executeHandlers_();
  } else {
    // we've tried all the handlers and none of them worked
    var msg = 'Error! See fine log for more details. ' + this.modUri_;
    goog.log.error(os.net.Request.LOGGER_, msg);
    this.handlerCleanup_();
    this.dispatchEvent(goog.net.EventType.ERROR);
  }
};


/**
 * Cleanup handlers
 * @private
 */
os.net.Request.prototype.handlerCleanup_ = function() {
  if (this.handler_) {
    this.removeHandlerListeners(this.handler_);
    this.handler_.dispose();
  }

  this.handler_ = null;
  this.handlers_ = null;
};

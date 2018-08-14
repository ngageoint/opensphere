goog.provide('os.net.IRequestHandler');
goog.require('goog.Uri');
goog.require('goog.disposable.IDisposable');
goog.require('goog.events.Listenable');
goog.require('os.net.IDataFormatter');



/**
 * A request handler is the thing which actually retrieves the request.
 * Implementations should dispatch {@link goog.net.EventType.SUCCESS}
 * on request completion and {@link goog.net.EventType.ERROR} on
 * request failure.
 *
 * @interface
 * @extends {goog.events.Listenable}
 * @extends {goog.disposable.IDisposable}
 */
os.net.IRequestHandler = function() {};


/**
 * The score for this handler. Handlers will be tried in descending order
 * of score.
 * @return {number} The score
 */
os.net.IRequestHandler.prototype.getScore;


/**
 * Whether or not this handler can handle the given method and URI.
 * @param {string} method The method for the request
 * @param {goog.Uri} uri The URI
 * @return {boolean} True for can handle, false otherwise.
 */
os.net.IRequestHandler.prototype.handles;


/**
 * Aborts the current request if one is active.
 */
os.net.IRequestHandler.prototype.abort;


/**
 * Executes the handler and retrieves the URI.
 * @param {string} method The request method
 * @param {goog.Uri} uri The URI
 * @param {?Object.<string, string>=} opt_headers The request headers
 * @param {os.net.IDataFormatter=} opt_formatter The data formatter
 * @param {boolean=} opt_nocache Whether or not to skip the cache
 * @param {?goog.net.XhrIo.ResponseType=} opt_responseType The expected response type
 */
os.net.IRequestHandler.prototype.execute = function(method, uri, opt_headers, opt_formatter, opt_nocache,
    opt_responseType) {};


/**
 * Construct the request.
 */
os.net.IRequestHandler.prototype.buildRequest;


/**
 * Get the response
 * @return {*}
 */
os.net.IRequestHandler.prototype.getResponse;


/**
 * Get the response headers
 * @return {?Object.<string, string>}
 */
os.net.IRequestHandler.prototype.getResponseHeaders;


/**
 * Get the errors
 * @return {Array.<string>} The list of errors
 */
os.net.IRequestHandler.prototype.getErrors;


/**
 * Get the status code of the response
 * @return {number} The status code of the request
 */
os.net.IRequestHandler.prototype.getStatusCode;


/**
 * Gets the handler type identifier
 * @return {string}
 */
os.net.IRequestHandler.prototype.getHandlerType;


/**
 * @return {boolean} Returns true if this handler has handled the request.
 */
os.net.IRequestHandler.prototype.isHandled;

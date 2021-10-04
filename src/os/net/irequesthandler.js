goog.declareModuleId('os.net.IRequestHandler');

const Uri = goog.requireType('goog.Uri');
const IDisposable = goog.requireType('goog.disposable.IDisposable');
const Listenable = goog.requireType('goog.events.Listenable');
const ResponseType = goog.requireType('goog.net.XhrIo.ResponseType');
const {default: IDataFormatter} = goog.requireType('os.net.IDataFormatter');


/**
 * A request handler is the thing which actually retrieves the request.
 * Implementations should dispatch {@link goog.net.EventType.SUCCESS}
 * on request completion and {@link goog.net.EventType.ERROR} on
 * request failure.
 *
 * @interface
 * @extends {Listenable}
 * @extends {IDisposable}
 */
export default class IRequestHandler {
  /**
   * The score for this handler. Handlers will be tried in descending order
   * of score.
   * @return {number} The score
   */
  getScore() {}

  /**
   * Whether or not this handler can handle the given method and URI.
   * @param {string} method The method for the request
   * @param {Uri} uri The URI
   * @return {boolean} True for can handle, false otherwise.
   */
  handles(method, uri) {}

  /**
   * Aborts the current request if one is active.
   */
  abort() {}

  /**
   * Construct the request.
   */
  buildRequest() {}

  /**
   * Get the response
   * @return {*}
   */
  getResponse() {}

  /**
   * Get the response headers
   * @return {?Object<string, string>}
   */
  getResponseHeaders() {}

  /**
   * Get the errors
   * @return {Array<string>} The list of errors
   */
  getErrors() {}

  /**
   * Get the status code of the response
   * @return {number} The status code of the request
   */
  getStatusCode() {}

  /**
   * Gets the handler type identifier
   * @return {string}
   */
  getHandlerType() {}

  /**
   * @return {boolean} Returns true if this handler has handled the request.
   */
  isHandled() {}

  /**
   * @return {number} Returns request timeout in milliseconds.
   */
  getTimeout() {}

  /**
   * @param {number} timeout sets the request timeout in milliseconds, default 0 for no timeout set (default).
   */
  setTimeout(timeout) {}

  /**
   * Executes the handler and retrieves the URI.
   *
   * @param {string} method The request method
   * @param {Uri} uri The URI
   * @param {?Object<string, string>=} opt_headers The request headers
   * @param {IDataFormatter=} opt_formatter The data formatter
   * @param {boolean=} opt_nocache Whether or not to skip the cache
   * @param {?ResponseType=} opt_responseType The expected response type
   */
  execute(method, uri, opt_headers, opt_formatter, opt_nocache, opt_responseType) {}
}

goog.provide('os.net.ProxyHandler');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.net.HandlerType');
goog.require('os.net.SameDomainHandler');



/**
 * Provides proxy support. Configure it like so:
 * <pre>
 * os.net.ProxyHandler.PROXY_URL = '/proxy?url={url}';
 * os.net.ProxyHandler.METHODS = ['GET', 'POST', ...];
 * os.net.ProxyHandler.SCHEMES = ['http', https', ...];
 * </pre>
 *
 * @extends {os.net.SameDomainHandler}
 * @constructor
 */
os.net.ProxyHandler = function() {
  os.net.ProxyHandler.base(this, 'constructor');

  // this is not the best way to get requests
  this.score = -10;
};
goog.inherits(os.net.ProxyHandler, os.net.SameDomainHandler);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.net.ProxyHandler.LOGGER_ = goog.log.getLogger('os.net.ProxyHandler');


/**
 * The proxy URL. Must contain '{url}', which will be replaced by the encoded
 * URL.
 * @type {string}
 */
os.net.ProxyHandler.PROXY_URL = '/proxy/{url}';


/**
 * The schemes that the proxy supports
 * @type {Array.<string>}
 */
os.net.ProxyHandler.SCHEMES = ['http'];


/**
 * The request methods that the proxy supports
 * @type {Array.<string>}
 */
os.net.ProxyHandler.METHODS = ['GET'];


/**
 * Whether or not to encode the remote URL in the proxy URL
 * @type {boolean}
 */
os.net.ProxyHandler.ENCODE = true;


/**
 * @param {?Object} conf
 */
os.net.ProxyHandler.configure = function(conf) {
  if (conf) {
    if (goog.isDef(conf['schemes'])) {
      os.net.ProxyHandler.SCHEMES = /** @type {Array<string>} */ (conf['schemes']);
    }

    if (goog.isDef(conf['methods'])) {
      os.net.ProxyHandler.METHODS = /** @type {Array<string>} */ (conf['methods']);
    }

    if (goog.isDef(conf['encode'])) {
      os.net.ProxyHandler.ENCODE = /** @type {boolean} */ (conf['encode']);
    }

    if (goog.isDef(conf['url'])) {
      os.net.ProxyHandler.PROXY_URL = /** @type {string} */ (conf['url']);
    }
  }
};


/**
 * @inheritDoc
 */
os.net.ProxyHandler.prototype.handles = function(method, uri) {
  /** @type {string} */
  var purl = os.net.ProxyHandler.PROXY_URL;

  if (!purl || purl.indexOf('{url}') == -1) {
    goog.log.warning(os.net.ProxyHandler.LOGGER_,
        'The proxy url is not set properly');
    return false;
  }

  /** @type {Array.<string>} */
  var methods = os.net.ProxyHandler.METHODS;
  if (!methods || methods.indexOf(method) == -1) {
    goog.log.fine(os.net.ProxyHandler.LOGGER_,
        'The ' + method + ' method is not supported by the proxy.');
    return false;
  }

  /** @type {Array.<string>} */
  var schemes = os.net.ProxyHandler.SCHEMES;
  if (!schemes || schemes.indexOf(uri.getScheme()) == -1) {
    goog.log.fine(os.net.ProxyHandler.LOGGER_,
        'The ' + uri.getScheme() + ' scheme is not supported by the proxy');
    return false;
  }

  return !os.net.ProxyHandler.superClass_.handles.call(this, method, uri);
};


/**
 * @inheritDoc
 */
os.net.ProxyHandler.prototype.modUri = function(uri) {
  return os.net.ProxyHandler.getProxyUri(uri);
};


/**
 * Get the proxy URI with the encoded url parameter set.
 * @param {goog.Uri|string} uri The URI parameter
 * @return {string} The proxy URI
 */
os.net.ProxyHandler.getProxyUri = function(uri) {
  uri = os.net.ProxyHandler.ENCODE ? encodeURIComponent(uri.toString()) : uri.toString();
  return os.net.ProxyHandler.PROXY_URL.replace('{url}', uri);
};


/**
 * @inheritDoc
 */
os.net.ProxyHandler.prototype.getHandlerType = function() {
  return os.net.HandlerType.PROXY;
};

goog.module('os.net.ProxyHandler');
goog.module.declareLegacyNamespace();

const log = goog.require('goog.log');
const HandlerType = goog.require('os.net.HandlerType');
const SameDomainHandler = goog.require('os.net.SameDomainHandler');
const Logger = goog.requireType('goog.log.Logger');


/**
 * Provides proxy support. Configure it like so:
 * <pre>
 * os.net.ProxyHandler.PROXY_URL = '/proxy?url={url}';
 * os.net.ProxyHandler.METHODS = ['GET', 'POST', ...];
 * os.net.ProxyHandler.SCHEMES = ['http', https', ...];
 * </pre>
 */
class ProxyHandler extends SameDomainHandler {
  /**
   * Constructor.
   */
  constructor() {
    super();

    // this is not the best way to get requests
    this.score = -10;
  }

  /**
   * @inheritDoc
   */
  handles(method, uri) {
    /** @type {string} */
    var purl = ProxyHandler.PROXY_URL;

    if (!purl || purl.indexOf('{url}') == -1) {
      log.warning(logger,
          'The proxy url is not set properly');
      return false;
    }

    /** @type {Array.<string>} */
    var methods = ProxyHandler.METHODS;
    if (!methods || methods.indexOf(method) == -1) {
      log.fine(logger,
          'The ' + method + ' method is not supported by the proxy.');
      return false;
    }

    /** @type {Array.<string>} */
    var schemes = ProxyHandler.SCHEMES;
    if (!schemes || schemes.indexOf(uri.getScheme()) == -1) {
      log.fine(logger,
          'The ' + uri.getScheme() + ' scheme is not supported by the proxy');
      return false;
    }

    return !super.handles(method, uri);
  }

  /**
   * @inheritDoc
   */
  modUri(uri) {
    return ProxyHandler.getProxyUri(uri);
  }

  /**
   * @inheritDoc
   */
  getHandlerType() {
    return HandlerType.PROXY;
  }

  /**
   * @param {?Object} conf
   */
  static configure(conf) {
    if (conf) {
      if (conf['schemes'] !== undefined) {
        ProxyHandler.SCHEMES = /** @type {Array<string>} */ (conf['schemes']);
      }

      if (conf['methods'] !== undefined) {
        ProxyHandler.METHODS = /** @type {Array<string>} */ (conf['methods']);
      }

      if (conf['encode'] !== undefined) {
        ProxyHandler.ENCODE = /** @type {boolean} */ (conf['encode']);
      }

      if (conf['url'] !== undefined) {
        ProxyHandler.PROXY_URL = /** @type {string} */ (conf['url']);
      }
    }
  }

  /**
   * Get the proxy URI with the encoded url parameter set.
   *
   * @param {goog.Uri|string} uri The URI parameter
   * @return {string} The proxy URI
   */
  static getProxyUri(uri) {
    uri = ProxyHandler.ENCODE ? encodeURIComponent(uri.toString()) : uri.toString();
    return ProxyHandler.PROXY_URL.replace('{url}', uri);
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.net.ProxyHandler');

/**
 * The proxy URL. Must contain '{url}', which will be replaced by the encoded
 * URL.
 * @type {string}
 */
ProxyHandler.PROXY_URL = '/proxy/{url}';

/**
 * The schemes that the proxy supports
 * @type {Array.<string>}
 */
ProxyHandler.SCHEMES = ['http'];

/**
 * The request methods that the proxy supports
 * @type {Array.<string>}
 */
ProxyHandler.METHODS = ['GET'];

/**
 * Whether or not to encode the remote URL in the proxy URL
 * @type {boolean}
 */
ProxyHandler.ENCODE = true;

exports = ProxyHandler;

goog.module('os.net.ProxylessDomainHandler');
goog.module.declareLegacyNamespace();

const HandlerType = goog.require('os.net.HandlerType');
const SameDomainHandler = goog.require('os.net.SameDomainHandler');

/**
 * A domain handler when a proxy is not configured, that assumes CORS isn't a necessary concern.
 * This is very useful for builds in Electron, where proxying isn't necessary.
 */
class ProxylessDomainHandler extends SameDomainHandler {
  /**
   * Constructor.
   */
  constructor() {
    super();

    // score below all other handlers as a catch-all.
    this.score = -100;
  }

  /**
   * @inheritDoc
   */
  handles(method, uri) {
    return true;
  }

  /**
   * @inheritDoc
   */
  getHandlerType() {
    return HandlerType.EXT_DOMAIN;
  }
}

exports = ProxylessDomainHandler;

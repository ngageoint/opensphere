goog.module('plugin.electron.net.ElectronHandler');

const HandlerType = goog.require('os.net.HandlerType');
const SameDomainHandler = goog.require('os.net.SameDomainHandler');

/**
 * Electron request handler.
 */
class ElectronHandler extends SameDomainHandler {
  /**
   * Constructor.
   */
  constructor() {
    super();
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

exports = ElectronHandler;

goog.module('plugin.electron.ElectronPlugin');
goog.module.declareLegacyNamespace();

const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const electron = goog.require('plugin.electron');
const ElectronConfirmCertUI = goog.require('plugin.electron.ElectronConfirmCertUI');


/**
 * Handle client certificate request from Electron.
 * @param {string} url The URL requesting a certificate.
 * @param {!Array<!Electron.Certificate>} certs The available client certificates.
 * @return {!Promise<!Electron.Certificate>} A promise that resolves to the selected certificate.
 */
const onCertificateRequest = (url, certs) => {
  return ElectronConfirmCertUI.launchConfirmCert(url, certs);
};


/**
 * Plugin to integrate Electron support.
 */
class ElectronPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = electron.ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    if (electron.isElectron()) {
      ElectronOS.registerCertificateHandler(onCertificateRequest);

      /**
       * Electron uses the file protocol, so those URL's need to be considered safe.
       * @suppress {const}
       */
      goog.html.SAFE_URL_PATTERN_ = /^(?:(?:https?|mailto|ftp|file):|[^:/?#]*(?:[/?#]|$))/i;
    }
  }
}


exports = ElectronPlugin;

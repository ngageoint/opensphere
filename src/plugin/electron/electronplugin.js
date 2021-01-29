goog.module('plugin.electron.ElectronPlugin');
goog.module.declareLegacyNamespace();

goog.require('plugin.electron.ElectronMemoryConfigUI');

const Settings = goog.require('os.config.Settings');
const Request = goog.require('os.net.Request');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const {ID, SettingKey, isElectron} = goog.require('plugin.electron');
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
 * Check for app updates.
 * @protected
 */
const checkForUpdates = () => {
  const settings = Settings.getInstance();
  const releaseUrl = settings.get(SettingKey.RELEASE_URL, '');
  if (releaseUrl) {
    const releaseChannel = /** @type {string} */ (settings.get(SettingKey.RELEASE_CHANNEL, 'latest'));
    const request = new Request(`${releaseUrl}/${releaseChannel}.yml`);
    request.getPromise().then((response) => {
      if (response) {
        // Update file exists, notify the main process to check it.
        ElectronOS.checkForUpdates();
      }
    }, () => {
      // Couldn't retrieve update file, don't check for updates.
    });
  }
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
    this.id = ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    if (isElectron()) {
      ElectronOS.registerCertificateHandler(onCertificateRequest);
      os.ui.list.add('pluginMemoryConfig', '<electronmemoryconfig></electronmemoryconfig>');

      /**
       * Electron uses the file protocol, so those URL's need to be considered safe.
       * @suppress {const}
       */
      goog.html.SAFE_URL_PATTERN_ = /^(?:(?:https?|mailto|ftp|file):|[^:/?#]*(?:[/?#]|$))/i;

      checkForUpdates();
    }
  }
}


//
// Electron does not natively support document.cookie, which both OpenSphere and Closure use internally. Override the
// native API with functions exposed in the preload script.
//
if (isElectron()) {
  Object.defineProperty(document, 'cookie', {
    enumerable: true,
    configurable: true,
    get() {
      return ElectronOS.getCookies();
    },
    set(value) {
      ElectronOS.setCookie(value);
    }
  });

  // Request an updated cookie list from the main process.
  ElectronOS.updateCookies();
}


exports = ElectronPlugin;

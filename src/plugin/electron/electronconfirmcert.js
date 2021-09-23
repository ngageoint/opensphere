goog.declareModuleId('plugin.electron.ElectronConfirmCertUI');

import {ROOT} from '../../os/os.js';

const Module = goog.require('os.ui.Module');
const WindowEventType = goog.require('os.ui.WindowEventType');
const windowSelector = goog.require('os.ui.windowSelector');
const {launchConfirm} = goog.require('os.ui.window.ConfirmUI');


/**
 * Prompt the user to select a certificate for an Electron network request.
 * @return {angular.Directive}
 */
export const directive = () => ({
  replace: true,
  restrict: 'E',
  templateUrl: ROOT + 'views/plugin/electron/electronconfirmcert.html',
  controller: Controller,
  controllerAs: 'ctrl'
});


/**
 * Add the directive to the os.ui module
 */
Module.directive('electronconfirmcert', [directive]);


/**
 * Controller for the certificate confirmation directive.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @ngInject
   */
  constructor($scope) {
    /**
     * The Angular scope.
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * The selected certificate.
     * @type {Electron.Certificate}
     */
    this['cert'] = null;

    $scope.$watch('ctrl.cert', (newVal, oldVal) => {
      $scope.$parent['confirmValue'] = newVal;
    });
  }

  /**
   * Angular $onDestroy lifecycle function.
   */
  $onDestroy() {
    this.scope = null;
  }

  /**
   * Angular $onInit lifecycle function.
   */
  $onInit() {
    if (this.scope) {
      const certs = /** @type {Array<!Electron.Certificate>} */ (this.scope['certs']);
      if (certs) {
        this['cert'] = certs[0];
      }

      this.scope.$emit(WindowEventType.READY);
    }
  }

  /**
   * Format the certificate expiry to a date string.
   * @param {Electron.Certificate} cert The certificate.
   * @return {string} The formatted expiry.
   * @export
   */
  formatExpiry(cert) {
    let expiry = 'Unknown';
    if (cert && cert.validExpiry > 0) {
      expiry = moment(cert.validExpiry * 1000).format('YYYY MMM D');
    }

    return expiry;
  }
}

/**
 * Launch a dialog prompting the user to select a certificate.
 * @param {string} url The URL requesting a certificate.
 * @param {!Array<!Electron.Certificate>} certs The available client certificates.
 * @return {!Promise<!Electron.Certificate>} A promise that resolves to the selected certificate.
 */
export const launchConfirmCert = (url, certs) => {
  return new Promise((resolve, reject) => {
    // Listen for unload event to reject the promise.
    const unloadListener = (event) => {
      reject('unload');
    };
    window.addEventListener('beforeunload', unloadListener);

    // Clean up the unload listener and resolve the promise.
    const confirm = (cert) => {
      window.removeEventListener('beforeunload', unloadListener);
      resolve(cert);
    };

    // Reject the promise if the user cancels the request.
    const cancel = () => {
      reject(new Error('User cancelled certificate request.'));
    };

    launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
      confirm: confirm,
      cancel: cancel,
      prompt: '<electronconfirmcert></electronconfirmcert>',
      windowOptions: /** @type {!osx.window.WindowOptions} */ ({
        label: 'Select a Certificate',
        icon: 'fa fa-key',
        height: 'auto',
        width: 450,
        modal: true,
        parent: windowSelector.APP
      })
    }), {
      'certs': certs,
      'prompt': `Please select a certificate to authenticate yourself to <span class="text-monospace">${url}</span>.`
    });
  });
};

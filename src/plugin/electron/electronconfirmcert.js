goog.module('plugin.electron.ElectronConfirmCertUI');

const Module = goog.require('os.ui.Module');
const WindowEventType = goog.require('os.ui.WindowEventType');
const windowSelector = goog.require('os.ui.windowSelector');
const {launchConfirm} = goog.require('os.ui.window.ConfirmUI');


/**
 * Prompt the user to select a certificate for an Electron network request.
 * @return {angular.Directive}
 */
const directive = () => ({
  replace: true,
  restrict: 'E',
  templateUrl: os.ROOT + 'views/plugin/electron/electronconfirmcert.html',
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
class Controller {
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
        certs.sort(sortCerts);
        this['cert'] = certs[0];
      }

      this.scope.$emit(WindowEventType.READY);
    }
  }

  /**
   * Get the user-facing name for a certificate.
   * @param {Electron.Certificate} cert The certificate.
   * @return {string} The name.
   * @export
   */
  getName(cert) {
    return cert ? `${cert.subjectName} (${cert.issuerName})` : 'Unknown Certificate';
  }
}


/**
 * Sort client certificates by subject/issuer name.
 * @param {Electron.Certificate} a First certificate.
 * @param {Electron.Certificate} b Second certificate.
 * @return {number} The sort value.
 */
const sortCerts = (a, b) => {
  // Sort by subject name, then issuer name.
  return a.subjectName === b.subjectName ?
      (a.issuerName > b.issuerName ? 1 : a.issuerName === b.issuerName ? 0 : -1) :
      (a.subjectName > b.subjectName ? 1 : -1);
};


/**
 * Launch a dialog prompting the user to select a certificate.
 * @param {string} url The URL requesting a certificate.
 * @param {!Array<!Electron.Certificate>} certs The available client certificates.
 * @return {!Promise<!Electron.Certificate>} A promise that resolves to the selected certificate.
 */
const launchConfirmCert = (url, certs) => {
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
        height: 'auto',
        modal: true,
        parent: windowSelector.APP
      })
    }), {
      'certs': certs,
      'prompt': `Select a certificate to authenticate yourself to ${url}`
    });
  });
};

exports = {
  Controller,
  directive,
  launchConfirmCert
};

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
     * @type {Electron.Certificate}
     */
    this['cert'] = $scope['certs'] && $scope['certs'][0] || null;

    $scope.$watch('ctrl.cert', function(newVal, oldVal) {
      if (newVal != oldVal) {
        $scope.$parent['confirmValue'] = newVal;
      }
    });

    $scope.$emit(WindowEventType.READY);
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
 * Launch a dialog prompting the user to select a certificate.
 * @param {string} url The URL requesting a certificate.
 * @param {!Array<!Electron.Certificate>} certs The available client certificates.
 * @return {!Promise} A promise that resolves to the selected certificate.
 */
const launchConfirmCert = function(url, certs) {
  return new Promise((resolve, reject) => {
    launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
      confirm: resolve,
      confirmValue: certs[0],
      // User cancel should resolve the promise with no cert selection.
      cancel: resolve,
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

goog.module('os.ui.window.ConfirmColorUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.color.colorPickerDirective');

const Module = goog.require('os.ui.Module');
const window = goog.require('os.ui.window');
const ConfirmUI = goog.require('os.ui.window.ConfirmUI');



/**
 * Color confirmation dialog.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  templateUrl: os.ROOT + 'views/window/confirmcolor.html',
  controller: Controller,
  controllerAs: 'confirmcolor'
});


/**
 * Add the directive to the os.ui module
 */
Module.directive('confirmcolor', [directive]);



/**
 * Controller for the color confirmation window.
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    $scope.$watch('confirmValue', function(newVal, oldVal) {
      if (newVal != oldVal) {
        $scope.$parent['confirmValue'] = newVal;
      }
    });
  }
}

/**
 * Launch a dialog prompting the user to pick a color.
 *
 * @param {Function} confirm
 * @param {string=} opt_default The default color to use
 */
window.launchConfirmColor = function(confirm, opt_default) {
  var windowOptions = {
    'label': 'Choose Color',
    'icon': 'fa fa-tint',
    'x': 'center',
    'y': 'center',
    'width': 195,
    'height': 'auto',
    'modal': 'true',
    'show-close': 'false'
  };

  ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
    confirm: confirm,
    confirmValue: opt_default || '#ffffff',
    prompt: '<confirmcolor></confirmcolor>',
    windowOptions: windowOptions
  }));
};

exports = {
  Controller,
  directive
};

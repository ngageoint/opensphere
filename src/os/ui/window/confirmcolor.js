goog.module('os.ui.window.ConfirmColorUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.color.ColorPickerUI');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const osWindow = goog.require('os.ui.window');
const {launchConfirm} = goog.require('os.ui.window.ConfirmUI');


/**
 * Color confirmation dialog.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  templateUrl: ROOT + 'views/window/confirmcolor.html',
  controller: Controller,
  controllerAs: 'confirmcolor'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'confirmcolor';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

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
const launchConfirmColor = function(confirm, opt_default) {
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

  launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
    confirm: confirm,
    confirmValue: opt_default || '#ffffff',
    prompt: `<${directiveTag}></${directiveTag}>`,
    windowOptions: windowOptions
  }));
};

/**
 * @type {function(Function, string=)}
 * @deprecated Please use os.ui.window.ConfirmColorUI.launchConfirmColor.
 */
osWindow.launchConfirmColor = launchConfirmColor;

exports = {
  Controller,
  directive,
  directiveTag,
  launchConfirmColor
};

goog.provide('os.ui.window.ConfirmColorCtrl');
goog.provide('os.ui.window.confirmColorDirective');

goog.require('os.ui.Module');
goog.require('os.ui.color.colorPickerDirective');
goog.require('os.ui.window');
goog.require('os.ui.window.confirmDirective');


/**
 * Color confirmation dialog.
 * @return {angular.Directive}
 */
os.ui.window.confirmColorDirective = function() {
  return {
    restrict: 'E',
    templateUrl: os.ROOT + 'views/window/confirmcolor.html',
    controller: os.ui.window.ConfirmColorCtrl,
    controllerAs: 'confirmcolor'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('confirmcolor', [os.ui.window.confirmColorDirective]);



/**
 * Controller for the color confirmation window.
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.window.ConfirmColorCtrl = function($scope) {
  $scope.$watch('confirmValue', function(newVal, oldVal) {
    if (newVal != oldVal) {
      $scope.$parent['confirmValue'] = newVal;
    }
  });
};


/**
 * Launch a dialog prompting the user to pick a color.
 * @param {Function} confirm
 * @param {string=} opt_default The default color to use
 */
os.ui.window.launchConfirmColor = function(confirm, opt_default) {
  var scopeOptions = {
    'confirmCallback': confirm,
    'confirmValue': opt_default || '#ffffff',
    'yesText': 'OK',
    'yesIcon': 'fa fa-check lt-blue-icon',
    'noText': 'Cancel',
    'noIcon': 'fa fa-ban red-icon'
  };

  var windowOptions = {
    'label': 'Choose Color',
    'icon': 'fa fa-tint lt-blue-icon',
    'x': 'center',
    'y': 'center',
    'width': '185',
    'height': '100',
    'modal': 'true',
    'show-close': 'false',
    'no-scroll': 'true'
  };

  var template = '<confirm><confirmcolor></confirmcolor></confirm>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};

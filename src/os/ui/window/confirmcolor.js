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
  var windowOptions = {
    'label': 'Choose Color',
    'icon': 'fa fa-tint',
    'x': 'center',
    'y': 'center',
    'width': '185',
    'height': 'auto',
    'modal': 'true',
    'show-close': 'false',
    'no-scroll': 'true'
  };

  os.ui.window.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
    confirm: confirm,
    confirmValue: opt_default || '#ffffff',
    prompt: '<confirmcolor></confirmcolor>',
    windowOptions: windowOptions
  }));
};

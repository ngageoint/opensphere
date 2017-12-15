goog.provide('os.ui.window.ConfirmNameCtrl');
goog.provide('os.ui.window.confirmNameDirective');

goog.require('os.ui.Module');
goog.require('os.ui.window');
goog.require('os.ui.window.confirmDirective');


/**
 * Name confirmation dialog.
 * @return {angular.Directive}
 */
os.ui.window.confirmNameDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    template: '<div>Name: <input class="dedupe-config" type="text" required ng-model="confirmValue"></input></div>',
    controller: os.ui.window.ConfirmNameCtrl,
    controllerAs: 'confirm'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('confirmname', [os.ui.window.confirmNameDirective]);



/**
 * Controller for the color confirmation window.
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.window.ConfirmNameCtrl = function($scope) {
  $scope.$watch('confirmValue', function(newVal, oldVal) {
    if (newVal != oldVal) {
      $scope.$parent['confirmValue'] = newVal;
    }
  });

  $scope.$emit(os.ui.WindowEventType.READY);
};


/**
 * Launch a dialog prompting the user to pick a column.
 * @param {!osx.window.ConfirmColumnOptions} options
 */
os.ui.window.launchName = function(options) {
  var scopeOptions = {
    'confirmCallback': options.confirm,
    'confirmValue': options.defaultValue,
    'yesText': 'OK',
    'yesIcon': 'fa fa-check lt-blue-icon',
    'noText': 'Cancel',
    'noIcon': 'fa fa-ban red-icon'
  };

  var windowOverrides = /** @type {!osx.window.WindowOptions} */ (options.windowOptions || {});
  var windowOptions = {
    'label': windowOverrides.label || 'Choose Name',
    'icon': windowOverrides.icon || '',
    'x': windowOverrides.x || 'center',
    'y': windowOverrides.y || 'center',
    'width': windowOverrides.width || 'auto',
    'height': windowOverrides.height || 'auto',
    'modal': windowOverrides.modal != null ? windowOverrides.modal : 'true',
    'show-close': windowOverrides.showClose != null ? windowOverrides.showClose : 'false',
    'no-scroll': windowOverrides.noScroll != null ? windowOverrides.noScroll : 'true'
  };

  var template = '<confirm><confirmname></confirmname></confirm>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};

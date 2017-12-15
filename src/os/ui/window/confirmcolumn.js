goog.provide('os.ui.window.ConfirmColumnCtrl');
goog.provide('os.ui.window.confirmColumnDirective');

goog.require('os.ui.Module');
goog.require('os.ui.window');
goog.require('os.ui.window.confirmDirective');


/**
 * Color confirmation dialog.
 * @return {angular.Directive}
 */
os.ui.window.confirmColumnDirective = function() {
  return {
    restrict: 'E',
    templateUrl: os.ROOT + 'views/window/confirmcolumn.html',
    controller: os.ui.window.ConfirmColumnCtrl,
    controllerAs: 'confirm'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('confirmcolumn', [os.ui.window.confirmColumnDirective]);



/**
 * Controller for the color confirmation window.
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.window.ConfirmColumnCtrl = function($scope) {
  /**
   * @type {os.data.ColumnDefinition}
   */
  this['column'] = null;

  $scope.$watch('confirm.column', function(newVal, oldVal) {
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
os.ui.window.launchConfirmColumn = function(options) {
  var scopeOptions = {
    'confirmCallback': options.confirm,
    'cancelCallback': options.cancel,
    'confirmValue': options.defaultValue,
    'yesText': 'OK',
    'yesIcon': 'fa fa-check lt-blue-icon',
    'noText': 'Cancel',
    'noIcon': 'fa fa-ban red-icon',
    'columns': options.columns,
    'prompt': options.prompt
  };

  var windowOverrides = /** @type {!osx.window.WindowOptions} */ (options.windowOptions || {});
  var windowOptions = {
    'label': windowOverrides.label || 'Choose Column',
    'icon': windowOverrides.icon || '',
    'x': windowOverrides.x || 'center',
    'y': windowOverrides.y || 'center',
    'width': windowOverrides.width || 325,
    'height': windowOverrides.height || 'auto',
    'modal': windowOverrides.modal != null ? windowOverrides.modal : 'true',
    'show-close': windowOverrides.showClose != null ? windowOverrides.showClose : 'false',
    'no-scroll': windowOverrides.noScroll != null ? windowOverrides.noScroll : 'true'
  };

  var template = '<confirm><confirmcolumn></confirmcolumn></confirm>';
  os.ui.window.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
};

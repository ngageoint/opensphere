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
    replace: true,
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
    'columns': options.columns,
    'prompt': options.prompt
  };

  var windowOptions = /** @type {!osx.window.WindowOptions} */ (options.windowOptions || {});
  windowOptions.label = windowOptions.label || 'Choose Column';
  windowOptions.height = 'auto';

  os.ui.window.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
    confirm: options.confirm,
    confirmValue: options.defaultValue,
    cancel: options.cancel,
    prompt: '<confirmcolumn></confirmcolumn>',
    windowOptions: windowOptions
  }), scopeOptions);
};

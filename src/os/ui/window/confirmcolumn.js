goog.module('os.ui.window.ConfirmColumnUI');
goog.module.declareLegacyNamespace();

const ui = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const window = goog.require('os.ui.window');
const ConfirmUI = goog.require('os.ui.window.ConfirmUI');


/**
 * Color confirmation dialog.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  replace: true,
  restrict: 'E',
  templateUrl: os.ROOT + 'views/window/confirmcolumn.html',
  controller: Controller,
  controllerAs: 'confirm'
});

/**
 * Add the directive to the ui module
 */
Module.directive('confirmcolumn', [directive]);



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
    /**
     * @type {os.data.ColumnDefinition}
     */
    this['column'] = null;

    $scope.$watch('confirm.column', function(newVal, oldVal) {
      if (newVal != oldVal) {
        $scope.$parent['confirmValue'] = newVal;
      }
    });

    $scope.$emit(ui.WindowEventType.READY);
  }
}


/**
 * Launch a dialog prompting the user to pick a column.
 *
 * @param {!osx.window.ConfirmColumnOptions} options
 */
window.launchConfirmColumn = function(options) {
  var scopeOptions = {
    'columns': options.columns,
    'prompt': options.prompt
  };

  var windowOptions = /** @type {!osx.window.WindowOptions} */ (options.windowOptions || {});
  windowOptions.label = windowOptions.label || 'Choose Column';
  windowOptions.height = 'auto';

  ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
    confirm: options.confirm,
    confirmValue: options.defaultValue,
    cancel: options.cancel,
    prompt: '<confirmcolumn></confirmcolumn>',
    windowOptions: windowOptions
  }), scopeOptions);
};

exports = {
  Controller,
  directive
};

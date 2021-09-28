goog.declareModuleId('os.ui.window.ConfirmColumnUI');

import {ROOT} from '../../os.js';
import Module from '../module.js';
import WindowEventType from '../windoweventtype.js';
import * as ConfirmUI from './confirm.js';

const ColumnDefinition = goog.requireType('os.data.ColumnDefinition');


/**
 * Color confirmation dialog.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  replace: true,
  restrict: 'E',
  templateUrl: ROOT + 'views/window/confirmcolumn.html',
  controller: Controller,
  controllerAs: 'confirm'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'confirmcolumn';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the color confirmation window.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {ColumnDefinition}
     */
    this['column'] = null;

    $scope.$watch('confirm.column', function(newVal, oldVal) {
      if (newVal != oldVal) {
        $scope.$parent['confirmValue'] = newVal;
      }
    });

    $scope.$emit(WindowEventType.READY);
  }
}

/**
 * Launch a dialog prompting the user to pick a column.
 *
 * @param {!osx.window.ConfirmColumnOptions} options
 */
export const launchConfirmColumn = function(options) {
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
    prompt: `<${directiveTag}></${directiveTag}>`,
    windowOptions: windowOptions
  }), scopeOptions);
};

goog.declareModuleId('os.ui.window.ConfirmColorUI');

import '../color/colorpicker.js';
import {ROOT} from '../../os.js';
import Module from '../module.js';
import {launchConfirm} from './confirm.js';


/**
 * Color confirmation dialog.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  templateUrl: ROOT + 'views/window/confirmcolor.html',
  controller: Controller,
  controllerAs: 'confirmcolor'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'confirmcolor';

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
export const launchConfirmColor = function(confirm, opt_default) {
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

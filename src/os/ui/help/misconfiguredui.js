goog.declareModuleId('os.ui.help.MisconfiguredWindowUI');

import Module from '../module.js';
import WindowEventType from '../windoweventtype.js';
import {directiveTag as misconfigured} from './misconfigured.js';


/**
 * The UI template.
 * @type {string}
 */
const template = [
  '<div class="js-window__wrapper">',
  '<div class="js-window__content">',
  `<${misconfigured} reason="{{reason}}" name="{{name}}"></${misconfigured}>`,
  '</div>',
  '</div>'
].join('');

/**
 * The misconfiguredUi directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: {
    'reason': '@',
    'name': '@'
  },
  template,
  controller: Controller,
  controllerAs: 'misconfiguredUi'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'misconfigured-ui';

/**
 * Add the directive to the module.
 */
Module.directive('misconfiguredUi', [directive]);

/**
 * Controller function for the misconfiguredUi directive
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    $scope.$emit(WindowEventType.READY);
  }
}

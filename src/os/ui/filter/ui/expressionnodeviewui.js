goog.declareModuleId('os.ui.filter.ui.ExpressionNodeViewUI');

import Module from '../../module.js';


/**
 * The view node UI for expression nodes.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: '<span class="c-glyph"></span>',
  controller: Controller,
  controllerAs: 'nodeUi'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'expressionnodeviewui';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for selected/highlighted node UI
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @ngInject
   */
  constructor() {}
}

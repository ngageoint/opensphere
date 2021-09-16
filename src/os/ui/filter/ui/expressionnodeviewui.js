goog.module('os.ui.filter.ui.ExpressionNodeViewUI');

const Module = goog.require('os.ui.Module');


/**
 * The view node UI for expression nodes.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
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
const directiveTag = 'expressionnodeviewui';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for selected/highlighted node UI
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @ngInject
   */
  constructor() {}
}

exports = {
  Controller,
  directive,
  directiveTag
};

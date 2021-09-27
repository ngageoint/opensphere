goog.declareModuleId('os.ui.filter.ui.ExpressionNodeUI');

import Module from '../../module.js';

const {default: ExpressionNode} = goog.requireType('os.ui.filter.ui.ExpressionNode');


/**
 * The edit/delete node UI for expression nodes.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,

  template: '<span>' +
      '<span ng-click="nodeUi.edit()">' +
      '<i class="fa fa-pencil fa-fw c-glyph" title="Edit the expression"></i></span>' +
      '<span ng-click="nodeUi.remove()">' +
      '<i class="fa fa-times fa-fw c-glyph" title="Remove the expression"></i></span>' +
      '</span>',

  controller: Controller,
  controllerAs: 'nodeUi'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'expressionnodeui';

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
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;
  }

  /**
   * Removes the expression
   *
   * @export
   */
  remove() {
    var node = /** @type {ExpressionNode} */ (this.scope_['item']);
    this.scope_.$emit('filterbuilder.remove', node);
  }

  /**
   * Edits the expression
   *
   * @export
   */
  edit() {
    var node = /** @type {ExpressionNode} */ (this.scope_['item']);
    this.scope_.$emit('advancedfilterbuilder.editExpr', node);
  }
}

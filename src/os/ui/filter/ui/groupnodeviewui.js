goog.declareModuleId('os.ui.filter.ui.GroupNodeViewUI');

import Module from '../../module.js';

const {default: GroupNode} = goog.requireType('os.ui.filter.ui.GroupNode');


/**
 * The view node UI for expression nodes.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: '<span>' +
      '<span>{{groupUi.group}}</span>' +
      '</span>',
  controller: Controller,
  controllerAs: 'groupUi'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'groupnodeviewui';

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

    var node = /** @type {GroupNode} */ (this.scope_['item']);
    this['group'] = Controller.GROUPS[node.getGrouping()];
  }
}

/**
 * Available groupings for advanced filter grouping nodes.
 * @type {Object<string, string>}
 * @const
 */
Controller.GROUPS = {
  'And': 'All (AND)',
  'Or': 'Any (OR)',
  'Not': 'Not'
};

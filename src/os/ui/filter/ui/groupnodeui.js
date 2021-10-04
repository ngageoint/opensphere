goog.declareModuleId('os.ui.filter.ui.GroupNodeUI');

import Module from '../../module.js';

const {default: GroupNode} = goog.requireType('os.ui.filter.ui.GroupNode');


/**
 * The edit/delete node UI for expression nodes.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: `
      <span class="flex-fill form-inline">
        <span class="flex-fill">
          <select class="custom-select" ng-model="item.grouping"
            ng-options="key for (key, value) in groupUi.groups"
            title="Whether results can match any or all filters in the group">
          </select>
        </span>
        <span>
          <span ng-show="!groupUi.isRoot" ng-click="groupUi.remove()">
            <i class="fa fa-times fa-fw c-glyph" title="Remove the expression"></i>
          </span>
        </span>
      </span>`,
  controller: Controller,
  controllerAs: 'groupUi'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'groupnodeui';

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
    this['groups'] = Controller.GROUPS;
    this['isRoot'] = !node.getParent();
  }

  /**
   * Removes the expression
   *
   * @export
   */
  remove() {
    var node = /** @type {GroupNode} */ (this.scope_['item']);
    this.scope_.$emit('filterbuilder.remove', node);
  }
}

/**
 * Available groupings for advanced filter grouping nodes.
 * @type {Object<string, string>}
 * @const
 */
Controller.GROUPS = {
  'All (AND)': 'And',
  'Any (OR)': 'Or',
  'Not': 'Not'
};

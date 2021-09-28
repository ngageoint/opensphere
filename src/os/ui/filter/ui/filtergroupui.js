goog.declareModuleId('os.ui.filter.ui.FilterGroupUI');

import BaseFilterManager from '../../../filter/basefiltermanager.js';
import Module from '../../module.js';
import FilterEventType from '../filtereventtype.js';

const {default: FilterEvent} = goog.requireType('os.ui.filter.FilterEvent');


/**
 * The selected/highlighted node UI directive for filter groups
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: '<span class="float-right">' +
      '<select class="filter-select" ng-model="groupUi.group" ng-change="groupUi.onGroup()"' +
      ' ng-options="key for (key, value) in groupUi.groups"' +
      ' title="Whether results can match any filter or must match all filters."/>' +
      '</span>',
  controller: Controller,
  controllerAs: 'groupUi'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'filtergroupui';

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

    var fqm = BaseFilterManager.getInstance();
    fqm.listen(FilterEventType.GROUPING_CHANGED, this.onGroupChanged_, false, this);
    var node = /** @type {os.structs.ITreeNode} */ (this.scope_['item']);

    this['group'] = fqm.getGrouping(node.getId());
    this['groups'] = Controller.GROUPS;

    this.scope_.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * Clean up
   *
   * @private
   */
  onDestroy_() {
    var fqm = BaseFilterManager.getInstance();
    fqm.unlisten(FilterEventType.GROUPING_CHANGED, this.onGroupChanged_, false, this);
  }

  /**
   * Handles group changes outside of this UI
   *
   * @param {FilterEvent} event
   * @private
   */
  onGroupChanged_(event) {
    var node = /** @type {os.structs.ITreeNode} */ (this.scope_['item']);

    if (event.key == node.getId()) {
      var fqm = BaseFilterManager.getInstance();
      this['group'] = fqm.getGrouping(event.key);
    }
  }

  /**
   * Update the grouping
   *
   * @export
   */
  onGroup() {
    var fqm = BaseFilterManager.getInstance();
    var node = /** @type {os.structs.ITreeNode} */ (this.scope_['item']);
    fqm.setGrouping(node.getId(), /** @type {boolean} */ (this['group']));
  }
}

/**
 * The group options
 * @type {!Object<string, boolean>}
 * @const
 */
Controller.GROUPS = {
  'Any': false,
  'All': true
};

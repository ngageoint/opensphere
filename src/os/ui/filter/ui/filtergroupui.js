goog.provide('os.ui.filter.ui.FilterGroupUICtrl');
goog.provide('os.ui.filter.ui.filterGroupUIDirective');
goog.require('os.ui.Module');
goog.require('os.ui.filter.FilterEvent');
goog.require('os.ui.filter.FilterEventType');
goog.require('os.ui.filter.FilterManager');
goog.require('os.ui.filter.ui.FilterNode');


/**
 * The selected/highlighted node UI directive for filter groups
 * @return {angular.Directive}
 */
os.ui.filter.ui.filterGroupUIDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: '<span class="pull-right">' +
        '<select class="filter-select" ng-model="groupUi.group" ng-change="groupUi.onGroup()"' +
        ' ng-options="key for (key, value) in groupUi.groups"' +
        ' title="Whether results can match any filter or must match all filters."/>' +
        '</span>',
    controller: os.ui.filter.ui.FilterGroupUICtrl,
    controllerAs: 'groupUi'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('filtergroupui', [os.ui.filter.ui.filterGroupUIDirective]);



/**
 * Controller for selected/highlighted node UI
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.filter.ui.FilterGroupUICtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  var fqm = os.ui.filter.FilterManager.getInstance();
  fqm.listen(os.ui.filter.FilterEventType.GROUPING_CHANGED, this.onGroupChanged_, false, this);
  var node = /** @type {os.structs.ITreeNode} */ (this.scope_['item']);

  this['group'] = fqm.getGrouping(node.getId());
  this['groups'] = os.ui.filter.ui.FilterGroupUICtrl.GROUPS;

  this.scope_.$on('$destroy', this.onDestroy_.bind(this));
};


/**
 * The group options
 * @type {!Object.<string, boolean>}
 * @const
 */
os.ui.filter.ui.FilterGroupUICtrl.GROUPS = {
  'Any': false,
  'All': true
};


/**
 * Clean up
 * @private
 */
os.ui.filter.ui.FilterGroupUICtrl.prototype.onDestroy_ = function() {
  var fqm = os.ui.filter.FilterManager.getInstance();
  fqm.unlisten(os.ui.filter.FilterEventType.GROUPING_CHANGED, this.onGroupChanged_, false, this);
};


/**
 * Handles group changes outside of this UI
 * @param {os.ui.filter.FilterEvent} event
 * @private
 */
os.ui.filter.ui.FilterGroupUICtrl.prototype.onGroupChanged_ = function(event) {
  var node = /** @type {os.structs.ITreeNode} */ (this.scope_['item']);

  if (event.key == node.getId()) {
    var fqm = os.ui.filter.FilterManager.getInstance();
    this['group'] = fqm.getGrouping(event.key);
  }
};


/**
 * Update the grouping
 */
os.ui.filter.ui.FilterGroupUICtrl.prototype.onGroup = function() {
  var fqm = os.ui.filter.FilterManager.getInstance();
  var node = /** @type {os.structs.ITreeNode} */ (this.scope_['item']);
  fqm.setGrouping(node.getId(), /** @type {boolean} */ (this['group']));
};
goog.exportProperty(os.ui.filter.ui.FilterGroupUICtrl.prototype, 'onGroup',
    os.ui.filter.ui.FilterGroupUICtrl.prototype.onGroup);

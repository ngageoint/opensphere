goog.provide('os.ui.filter.ui.GroupNodeUICtrl');
goog.provide('os.ui.filter.ui.GroupNodeUIDirective');
goog.require('os.ui.Module');


/**
 * The edit/delete node UI for expression nodes.
 * @return {angular.Directive}
 */
os.ui.filter.ui.GroupNodeUIDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    template: '<span>' +
        '<span class="group-glyphs slick-node-ui">' +
        '<span ng-if="!groupUi.isRoot" ng-click="groupUi.remove()">' +
        '<i class="fa fa-times fa-fw glyph glyph-remove" title="Remove the expression"></i></span>' +
        '</span>' +
        '<select class="filter-select" ng-model="item.grouping"' +
        ' ng-options="key for (key, value) in groupUi.groups" style="margin:0 0 3px 5px;"' +
        ' title="Whether results can match any or all filters in the group"/>' +
        '</span>',
    controller: os.ui.filter.ui.GroupNodeUICtrl,
    controllerAs: 'groupUi'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('groupnodeui', [os.ui.filter.ui.GroupNodeUIDirective]);



/**
 * Controller for selected/highlighted node UI
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.filter.ui.GroupNodeUICtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  var node = /** @type {os.ui.filter.ui.GroupNode} */ (this.scope_['item']);
  this['groups'] = os.ui.filter.ui.GroupNodeUICtrl.GROUPS;
  this['isRoot'] = !node.getParent();
};


/**
 * Available groupings for advanced filter grouping nodes.
 * @type {Object<string, string>}
 * @const
 */
os.ui.filter.ui.GroupNodeUICtrl.GROUPS = {
  'All (AND)': 'And',
  'Any (OR)': 'Or',
  'Not': 'Not'
};


/**
 * Removes the expression
 */
os.ui.filter.ui.GroupNodeUICtrl.prototype.remove = function() {
  var node = /** @type {os.ui.filter.ui.GroupNode} */ (this.scope_['item']);
  this.scope_.$emit('filterbuilder.remove', node);
};
goog.exportProperty(
    os.ui.filter.ui.GroupNodeUICtrl.prototype,
    'remove',
    os.ui.filter.ui.GroupNodeUICtrl.prototype.remove);

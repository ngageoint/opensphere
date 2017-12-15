goog.provide('os.ui.filter.ui.FilterTreeCtrl');
goog.provide('os.ui.filter.ui.filterTreeDirective');
goog.require('os.data.groupby.INodeGroupBy');
goog.require('os.ui');
goog.require('os.ui.Module');
goog.require('os.ui.filter.FilterManager');
goog.require('os.ui.filter.ui.FilterGroupBy');
goog.require('os.ui.filter.ui.FilterNode');
goog.require('os.ui.filter.ui.filterNodeUIDirective');
goog.require('os.ui.slick.TreeSearch');
goog.require('os.ui.slick.slickTreeDirective');


/**
 * The filter tree directive
 * @return {angular.Directive}
 */
os.ui.filter.ui.filterTreeDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'type': '='
    },
    template: '<div class="filters-main">' +
        '<slicktree x-data="filters" selected="selectedFilter"' +
        ' checkbox-tooltip="Enable or disable the filter" show-root="true"></slicktree>' +
        '</div>',
    controller: os.ui.filter.ui.FilterTreeCtrl,
    controllerAs: 'filterTree'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('filtertree', [os.ui.filter.ui.filterTreeDirective]);



/**
 * Controller for the filter tree
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.filter.ui.FilterTreeCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?os.ui.slick.TreeSearch}
   * @private
   */
  this.treeSearch_ = new os.ui.slick.TreeSearch([], 'filters', $scope);

  os.ui.filter.FilterManager.getInstance().listen(
      os.ui.filter.FilterEventType.FILTERS_REFRESH, this.refresh_, false, this);

  $scope.$watch('type', this.refresh_.bind(this));
  $scope.$on('$destroy', this.onDestroy_.bind(this));
  this.refresh_();
};


/**
 * Clean up references/listeners.
 * @private
 */
os.ui.filter.ui.FilterTreeCtrl.prototype.onDestroy_ = function() {
  os.ui.filter.FilterManager.getInstance().unlisten(
      os.ui.filter.FilterEventType.FILTERS_REFRESH, this.refresh_, false, this);
  this.scope_ = null;
};


/**
 * @type {os.data.groupby.INodeGroupBy}
 * @const
 * @private
 */
os.ui.filter.ui.FilterTreeCtrl.TYPE_GROUP_BY_ = new os.ui.filter.ui.FilterGroupBy();


/**
 * Refreshes the filter data
 * @param {goog.events.Event=} opt_e
 * @private
 */
os.ui.filter.ui.FilterTreeCtrl.prototype.refresh_ = function(opt_e) {
  var type = this.scope_['type'];
  var fqm = os.ui.filter.FilterManager.getInstance();
  var list = fqm.getFilters(type);
  var nodes = [];

  if (list) {
    for (var i = 0, n = list.length; i < n; i++) {
      var node = new os.ui.filter.ui.FilterNode();
      node.setEntry(list[i]);
      nodes.push(node);
    }
  }

  this.treeSearch_.setSearch(nodes);
  this.treeSearch_.beginSearch('', type ? null : os.ui.filter.ui.FilterTreeCtrl.TYPE_GROUP_BY_);

  // todo: sort by title?
  os.ui.apply(this.scope_);
};

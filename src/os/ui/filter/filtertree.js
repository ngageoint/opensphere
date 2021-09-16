goog.module('os.ui.filter.ui.FilterTreeUI');

goog.require('os.ui.slick.SlickTreeUI');

const BaseFilterManager = goog.require('os.filter.BaseFilterManager');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const FilterEventType = goog.require('os.ui.filter.FilterEventType');
const FilterGroupBy = goog.require('os.ui.filter.ui.FilterGroupBy');
const FilterNode = goog.require('os.ui.filter.ui.FilterNode');
const TreeSearch = goog.require('os.ui.slick.TreeSearch');

const INodeGroupBy = goog.requireType('os.data.groupby.INodeGroupBy');


/**
 * The filter tree directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: {
    'type': '='
  },
  template: '<div>' +
      '<slicktree x-data="filters" selected="selectedFilter"' +
      ' checkbox-tooltip="Enable or disable the filter" show-root="true"></slicktree>' +
      '</div>',
  controller: Controller,
  controllerAs: 'filterTree'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'filtertree';

/**
 * Add the directive to the ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the filter tree
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {?TreeSearch}
     * @private
     */
    this.treeSearch_ = new TreeSearch([], 'filters', $scope);

    BaseFilterManager.getInstance().listen(FilterEventType.FILTERS_REFRESH, this.refresh_, false, this);

    $scope.$watch('type', this.refresh_.bind(this));
    $scope.$on('$destroy', this.onDestroy_.bind(this));
    this.refresh_();
  }

  /**
   * Clean up references/listeners.
   *
   * @private
   */
  onDestroy_() {
    BaseFilterManager.getInstance().unlisten(FilterEventType.FILTERS_REFRESH, this.refresh_, false, this);
    this.scope_ = null;
  }

  /**
   * Refreshes the filter data
   *
   * @param {goog.events.Event=} opt_e
   * @private
   */
  refresh_(opt_e) {
    var type = this.scope_['type'];
    var fqm = BaseFilterManager.getInstance();
    var list = fqm.getFilters(type);
    var nodes = [];

    if (list) {
      for (var i = 0, n = list.length; i < n; i++) {
        var node = new FilterNode();
        node.setEntry(list[i]);
        nodes.push(node);
      }
    }

    this.treeSearch_.setSearch(nodes);
    this.treeSearch_.beginSearch('', type ? null : typeGroupBy);

    // todo: sort by title?
    apply(this.scope_);
  }
}

/**
 * @type {INodeGroupBy}
 */
const typeGroupBy = new FilterGroupBy();

exports = {
  Controller,
  directive,
  directiveTag
};

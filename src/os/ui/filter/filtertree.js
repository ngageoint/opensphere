goog.declareModuleId('os.ui.filter.ui.FilterTreeUI');

import '../slick/slicktree.js';
import BaseFilterManager from '../../filter/basefiltermanager.js';
import Module from '../module.js';
import TreeSearch from '../slick/treesearch.js';
import {apply} from '../ui.js';
import FilterEventType from './filtereventtype.js';
import FilterGroupBy from './ui/filtergroupby.js';
import FilterNode from './ui/filternode.js';

const {default: INodeGroupBy} = goog.requireType('os.data.groupby.INodeGroupBy');


/**
 * The filter tree directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
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
export const directiveTag = 'filtertree';

/**
 * Add the directive to the ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the filter tree
 * @unrestricted
 */
export class Controller {
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

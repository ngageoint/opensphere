goog.declareModuleId('os.ui.filter.FilterTreeSearch');

import {getFilterManager} from '../../query/queryinstance.js';
import AbstractGroupByTreeSearch from '../slick/abstractgroupbytreesearch.js';
import FilterNode from './ui/filternode.js';

const {default: FilterEntry} = goog.requireType('os.filter.FilterEntry');
const {default: ITreeNode} = goog.requireType('os.structs.ITreeNode');


/**
 * Extends AbstractGroupByTreeSearch to search through saved areas
 */
export default class FilterTreeSearch extends AbstractGroupByTreeSearch {
  /**
   * Constructor.
   * @param {!Array<!ITreeNode>} search The original tree to search
   * @param {!string} setAs The field to set on ...
   * @param {Object} onObj this object
   * @param {string=} opt_noResultLabel The label to use when there are no results
   */
  constructor(search, setAs, onObj, opt_noResultLabel) {
    super(search, setAs, onObj, opt_noResultLabel);
  }

  /**
   * Overridden in inheriting class
   *
   * @return {!Array}
   * @override
   */
  getSearchItems() {
    var tree = this.getSearch();
    if (tree) {
      var areas = tree.map(function(item) {
        return item.getEntry();
      });
      return areas;
    }
    return [];
  }

  /**
   * Overridden in inheriting class
   *
   * @param {Object} item - search item to setup as a node
   * @return {!ITreeNode}
   * @override
   */
  setupNode(item) {
    var node = new FilterNode();
    node.setEntry(/** @type {!FilterEntry} */ (item));
    node.setCheckboxVisible(true);
    return node;
  }

  /**
   * @override
   */
  fillListFromSearch(list) {
    var filters = getFilterManager().getStoredFilters();
    if (filters && filters.length > 0) {
      for (var i = 0, n = filters.length; i < n; i++) {
        var node = new FilterNode();
        node.setEntry(filters[i]);
        list.push(node);
      }
    } else {
      this.addNoResult(list);
    }
  }
}

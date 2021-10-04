goog.declareModuleId('os.data.FilterTreeSearch');

import {getFilterManager} from '../query/queryinstance.js';
import AbstractGroupByTreeSearch from '../ui/slick/abstractgroupbytreesearch.js';
import FilterNode from './filternode.js';

const {default: FilterEntry} = goog.requireType('os.filter.FilterEntry');


/**
 * Extends AbstractGroupByTreeSearch to search through saved areas
 */
export default class FilterTreeSearch extends AbstractGroupByTreeSearch {
  /**
   * Constructor.
   * @param {!string} setAs The field to set on ...
   * @param {Object} onObj this object
   * @param {string=} opt_noResultLabel The label to use when there are no results
   */
  constructor(setAs, onObj, opt_noResultLabel) {
    super([], setAs, onObj, opt_noResultLabel);
  }

  /**
   * @inheritDoc
   */
  getSearchItems() {
    return /** @type {!Array} */ (getFilterManager().getFilters());
  }

  /**
   * @inheritDoc
   */
  setupNode(item) {
    return new FilterNode(/** @type {FilterEntry} */ (item));
  }

  /**
   * @override
   */
  fillListFromSearch(list) {
    var filters = getFilterManager().getFilters();
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

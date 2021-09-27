goog.module('os.data.FilterTreeSearch');

const FilterNode = goog.require('os.data.FilterNode');
const {getFilterManager} = goog.require('os.query.instance');
const {default: AbstractGroupByTreeSearch} = goog.require('os.ui.slick.AbstractGroupByTreeSearch');

const FilterEntry = goog.requireType('os.filter.FilterEntry');


/**
 * Extends AbstractGroupByTreeSearch to search through saved areas
 */
class FilterTreeSearch extends AbstractGroupByTreeSearch {
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

exports = FilterTreeSearch;

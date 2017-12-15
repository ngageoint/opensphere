goog.provide('os.ui.filter.FilterTreeSearch');
goog.require('os.ui.filter.ui.FilterNode');
goog.require('os.ui.slick.AbstractGroupByTreeSearch');



/**
 * Extends AbstractGroupByTreeSearch to search through saved areas
 * @extends {os.ui.slick.AbstractGroupByTreeSearch}
 * @param {!Array.<!os.structs.ITreeNode>} search The original tree to search
 * @param {!string} setAs The field to set on ...
 * @param {Object} onObj this object
 * @param {string=} opt_noResultLabel The label to use when there are no results
 * @constructor
 */
os.ui.filter.FilterTreeSearch = function(search, setAs, onObj, opt_noResultLabel) {
  os.ui.filter.FilterTreeSearch.base(this, 'constructor', search, setAs, onObj, opt_noResultLabel);
};
goog.inherits(os.ui.filter.FilterTreeSearch, os.ui.slick.AbstractGroupByTreeSearch);


/**
 * Overridden in inheriting class
 * @return {!Array}
 * @override
 */
os.ui.filter.FilterTreeSearch.prototype.getSearchItems = function() {
  var tree = this.getSearch();
  if (tree) {
    var areas = tree.map(function(item) {
      return item.getEntry();
    });
    return areas;
  }
  return [];
};


/**
 * Overridden in inheriting class
 * @param {Object} item - search item to setup as a node
 * @return {!os.structs.ITreeNode}
 * @override
 */
os.ui.filter.FilterTreeSearch.prototype.setupNode = function(item) {
  var node = new os.ui.filter.ui.FilterNode();
  node.setEntry(/** @type {!os.filter.FilterEntry} */ (item));
  node.setCheckboxVisible(true);
  return node;
};


/**
 * @override
 */
os.ui.filter.FilterTreeSearch.prototype.fillListFromSearch = function(list) {
  var filters = os.ui.filterManager.getStoredFilters();
  if (filters && filters.length > 0) {
    for (var i = 0, n = filters.length; i < n; i++) {
      var node = new os.ui.filter.ui.FilterNode();
      node.setEntry(filters[i]);
      list.push(node);
    }
  } else {
    this.addNoResult(list);
  }
};

goog.provide('os.data.FilterTreeSearch');
goog.require('os.data.FilterNode');
goog.require('os.ui.filter.FilterManager');
goog.require('os.ui.slick.AbstractGroupByTreeSearch');



/**
 * Extends AbstractGroupByTreeSearch to search through saved areas
 * @extends {os.ui.slick.AbstractGroupByTreeSearch}
 * @param {!string} setAs The field to set on ...
 * @param {Object} onObj this object
 * @param {string=} opt_noResultLabel The label to use when there are no results
 * @constructor
 */
os.data.FilterTreeSearch = function(setAs, onObj, opt_noResultLabel) {
  os.data.FilterTreeSearch.base(this, 'constructor', [], setAs, onObj, opt_noResultLabel);
};
goog.inherits(os.data.FilterTreeSearch, os.ui.slick.AbstractGroupByTreeSearch);


/**
 * Overridden in inheriting class
 * @return {!Array}
 * @override
 */
os.data.FilterTreeSearch.prototype.getSearchItems = function() {
  return /** @type {!Array} */ (os.ui.filterManager.getFilters());
};


/**
 * Overridden in inheriting class
 * @param {Object} item - search item to setup as a node
 * @return {!os.structs.ITreeNode}
 * @override
 */
os.data.FilterTreeSearch.prototype.setupNode = function(item) {
  return new os.data.FilterNode(/** @type {os.filter.FilterEntry} */ (item));
};


/**
 * @override
 */
os.data.FilterTreeSearch.prototype.fillListFromSearch = function(list) {
  var filters = os.ui.filterManager.getFilters();
  if (filters && filters.length > 0) {
    for (var i = 0, n = filters.length; i < n; i++) {
      var node = new os.data.FilterNode();
      node.setEntry(filters[i]);
      list.push(node);
    }
  } else {
    this.addNoResult(list);
  }
};

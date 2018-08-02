goog.provide('os.ui.slick.AbstractGroupByTreeSearch');
goog.require('os.data.groupby.INodeGroupBy');
goog.require('os.structs.ITreeNode');
goog.require('os.structs.TreeNode');
goog.require('os.ui.slick.TreeSearch');



/**
 * AbstractGroupByTreeSearch allows you to filter a tree and group the results
 * @param {!Array.<!os.structs.ITreeNode>} search The original tree to search
 * @param {!string} setAs The field to set on...
 * @param {Object} onObj this object
 * @param {string=} opt_noResultLabel The label to use when there are no results
 * @extends {os.ui.slick.TreeSearch}
 * @constructor
 */
os.ui.slick.AbstractGroupByTreeSearch = function(search, setAs, onObj, opt_noResultLabel) {
  os.ui.slick.AbstractGroupByTreeSearch.base(this, 'constructor', search, setAs, onObj, opt_noResultLabel);
};
goog.inherits(os.ui.slick.AbstractGroupByTreeSearch, os.ui.slick.TreeSearch);


/**
 * Overridden to search with GroupBy
 * @override
 */
os.ui.slick.AbstractGroupByTreeSearch.prototype.searchNodes = function(exp, results, nodes) {
  var searchItems = this.getSearchItems();
  var groupBy = this.getGroupBy();
  var filterFunction = this.getFilterFunction();

  if (searchItems) {
    for (var i = 0, n = searchItems.length; i < n; i++) {
      var disposeNode = true; // more dispose cases than not!
      var node = /** @type {!os.structs.ITreeNode} */ (this.setupNode(searchItems[i]));

      // search
      var text = /** @type {os.data.ISearchable} */ (node).getSearchText();
      if (text) {
        var r = exp.test(text);

        if (r) {
          // if it passes the filter
          if (!filterFunction || filterFunction(node)) {
            // remove the "No Result" node
            if (results.length > 0 && results[0].getId() == 'noResults') {
              results.splice(0, 1);
            }

            // add it to the group by or the list
            if (groupBy) {
              groupBy.groupBy(node, results, true);
              // Note: the node will be cloned to avoid duplicate id's, so dispose of the original
            } else {
              results.push(node);
              disposeNode = false; // only case where you wouldn't want to dispose
            }
          }
        }

        // reset the regex for the next test
        exp.lastIndex = 0;
      }

      if (!(node.getId() in this.searchIds)) {
        if (groupBy) {
          groupBy.count(node);
        }

        this.searchIds[node.getId()] = true;
      }

      if (disposeNode) { // the node wasn't added to the tree, or a clone was added. dispose of it.
        node.dispose();
      }
    }
  }

  this.finalizeSearch(groupBy, results);
};


/**
 * Override in inheriting class
 * @return {!Array}
 */
os.ui.slick.AbstractGroupByTreeSearch.prototype.getSearchItems = function() {
  return [];
};


/**
 * Override in inheriting class
 * @param {Object} item - search item to setup as a node
 * @return {!os.structs.ITreeNode}
 */
os.ui.slick.AbstractGroupByTreeSearch.prototype.setupNode = function(item) {
  return new os.structs.TreeNode();
};

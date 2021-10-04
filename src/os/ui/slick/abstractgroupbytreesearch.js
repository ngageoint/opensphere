goog.declareModuleId('os.ui.slick.AbstractGroupByTreeSearch');

import TreeNode from '../../structs/treenode.js';
import TreeSearch from './treesearch.js';

const {default: ISearchable} = goog.requireType('os.data.ISearchable');
const {default: ITreeNode} = goog.requireType('os.structs.ITreeNode');


/**
 * AbstractGroupByTreeSearch allows you to filter a tree and group the results
 */
export default class AbstractGroupByTreeSearch extends TreeSearch {
  /**
   * Constructor.
   * @param {!Array<!ITreeNode>} search The original tree to search
   * @param {!string} setAs The field to set on...
   * @param {Object} onObj this object
   * @param {string=} opt_noResultLabel The label to use when there are no results
   */
  constructor(search, setAs, onObj, opt_noResultLabel) {
    super(search, setAs, onObj, opt_noResultLabel);
  }

  /**
   * Overridden to search with GroupBy
   *
   * @override
   */
  searchNodes(exp, results, nodes) {
    var searchItems = this.getSearchItems();
    var groupBy = this.getGroupBy();
    var filterFunction = this.getFilterFunction();

    if (searchItems) {
      for (var i = 0, n = searchItems.length; i < n; i++) {
        var disposeNode = true; // more dispose cases than not!
        var node = /** @type {!ITreeNode} */ (this.setupNode(searchItems[i]));

        // search
        var text = /** @type {ISearchable} */ (node).getSearchText();
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
  }

  /**
   * Override in inheriting class
   *
   * @return {!Array}
   */
  getSearchItems() {
    return [];
  }

  /**
   * Override in inheriting class
   *
   * @param {Object} item - search item to setup as a node
   * @return {!ITreeNode}
   */
  setupNode(item) {
    return new TreeNode();
  }
}

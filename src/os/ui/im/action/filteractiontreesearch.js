goog.declareModuleId('os.ui.im.action.FilterActionTreeSearch');

import ImportActionManager from '../../../im/action/importactionmanager.js';
import AbstractGroupByTreeSearch from '../../slick/abstractgroupbytreesearch.js';
import TreeSearch from '../../slick/treesearch.js';
import FilterActionNode from './filteractionnode.js';

const {default: FilterActionEntry} = goog.requireType('os.im.action.FilterActionEntry');
const {default: ITreeNode} = goog.requireType('os.structs.ITreeNode');


/**
 * Tree search for filter actions.
 */
export default class FilterActionTreeSearch extends AbstractGroupByTreeSearch {
  /**
   * Constructor.
   * @param {!string} property The property the search exists at.
   * @param {Object} onObj The object that the search exists on.
   * @param {string=} opt_type Optional filter action type.
   */
  constructor(property, onObj, opt_type) {
    super([], property, onObj);

    /**
     * @type {string|undefined}
     * @protected
     */
    this.entryType = opt_type;

    /**
     * Flag for whether to show default actions.
     * @type {boolean}
     * @protected
     */
    this.showDefaultActions = true;

    // filter out default actions when the flag is false
    this.setFilterFunction((node) => {
      var entry = /** @type {FilterActionNode} */ (node).getEntry();
      return !entry.getParent() && (this.showDefaultActions || !entry.isDefault());
    });
  }

  /**
   * Set whether to show default actions.
   * @param {boolean} value
   */
  setShowDefaultActions(value) {
    this.showDefaultActions = value;
  }

  /**
   * @inheritDoc
   */
  beginSearch(term, groupBy) {
    var oldSearch = /** @type {!Array<!ITreeNode>} */ (this.target[this.field].slice());
    super.beginSearch(term, groupBy);
    if (Array.isArray(oldSearch)) {
      // dispose the old nodes, otherwise they will be retained in memory due to listeners on the filter action entries
      oldSearch.forEach(function(node) {
        node.dispose();
      });

      oldSearch.length = 0;
    }
  }

  /**
   * @inheritDoc
   */
  getSearch() {
    var entries = ImportActionManager.getInstance().getActionEntries(this.entryType);
    var nodes = [];

    if (entries && entries.length > 0) {
      for (var i = 0, n = entries.length; i < n; i++) {
        nodes.push(this.setupNode(entries[i]));
      }
    }

    return nodes;
  }

  /**
   * @inheritDoc
   */
  setupNode(item) {
    return new FilterActionNode(/** @type {!FilterActionEntry} */ (item));
  }

  /**
   * Overridden to get parents and children as results
   *
   * @override
   */
  searchNodes(exp, results, nodes) {
    var fFn = this.getFilterFunction();

    if (nodes) {
      var groupBy = this.getGroupBy();
      for (var i = 0, n = nodes.length; i < n; i++) {
        var node = nodes[i];

        if (node && !node.getChildren()) {
          var text = this.getNodeSearchText(node);

          // search
          if (text) {
            var r = exp.test(text.toLowerCase());

            if (r) {
              // remove the "No Result" node
              if (results.length > 0 && results[0].getId() == 'noResults') {
                results.splice(0, 1);
              }

              // if we've already seen the same ID for some reason, skip it
              if (node.getId() in this.searchIds) {
                continue;
              }

              // if it passes the filter
              if (!fFn || fFn(node)) {
                groupBy ? groupBy.groupBy(node, results) : results.push(node);
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
        } else {
          var text = this.getNodeSearchText(node);

          // search
          if (text) {
            var r = exp.test(text.toLowerCase());

            // reset the regex for the next test
            exp.lastIndex = 0;

            if (r) {
              // remove the "No Result" node
              if (results.length > 0 && results[0].getId() == 'noResults') {
                results.splice(0, 1);
              }

              // if it passes the filter
              if (!fFn || fFn(node)) {
                var newNode = node.clone();
                if (groupBy) {
                  groupBy.groupBy(newNode, results);
                  groupBy.count(node);
                } else {
                  results.push(newNode);
                }
              }
            }
          }

          this.searchNodes(exp, results, node.getChildren());
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  fillListFromSearch(list) {
    var nodes = this.getSearch();

    if (nodes && nodes.length > 0) {
      for (var i = 0, n = nodes.length; i < n; i++) {
        list.push(nodes[i]);
      }
    } else {
      this.addNoResult(list);
    }
  }

  /**
   * @inheritDoc
   */
  setSort(list) {
    if (this.getGroupBy()) {
      // sort the top level by ID and every other level by label
      list.sort(TreeSearch.idCompare);

      for (var i = 0, n = list.length; i < n; i++) {
        var c = list[i].getChildren();

        if (c) {
          c.sort(TreeSearch.labelCompare);
        }
      }
    }

    // do NOT sort if there isn't a group by
  }
}

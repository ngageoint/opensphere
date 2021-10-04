goog.declareModuleId('os.ui.slick.TreeSearch');

import ISearchable from '../../data/isearchable.js';
import osImplements from '../../implements.js';
import {merge} from '../../object/object.js';
import SlickTreeNode from './slicktreenode.js';

const Disposable = goog.require('goog.Disposable');
const {defaultCompare} = goog.require('goog.array');
const {numerateCompare, regExpEscape} = goog.require('goog.string');

const {default: INodeGroupBy} = goog.requireType('os.data.groupby.INodeGroupBy');
const {default: ITreeNode} = goog.requireType('os.structs.ITreeNode');


/**
 * Tree search allows you to filter a tree and group the results
 */
export default class TreeSearch extends Disposable {
  /**
   * Constructor.
   * @param {!Array<!ITreeNode>} search The original tree to search
   * @param {!string} setAs The field to set on...
   * @param {Object} onObj this object
   * @param {string=} opt_noResultLabel The label to use when there are no results
   */
  constructor(search, setAs, onObj, opt_noResultLabel) {
    super();

    /**
     * @type {!Array<!ITreeNode>}
     * @private
     */
    this.search_ = search;

    /**
     * @type {!string}
     * @protected
     */
    this.field = setAs;

    /**
     * @type {Object}
     * @protected
     */
    this.target = onObj;

    /**
     * @type {?function(ITreeNode):boolean}
     * @private
     */
    this.filterFunc_ = null;

    /**
     * @type {!string}
     * @private
     */
    this.noResultLabel_ = opt_noResultLabel || 'No results';

    /**
     * @type {?INodeGroupBy}
     * @private
     */
    this.lastGroupBy_ = null;

    /**
     * @type {?INodeGroupBy}
     * @private
     */
    this.groupBy_ = null;

    /**
     * @type {?Object<string, boolean>}
     * @protected
     */
    this.searchIds = null;

    /**
     * @type {Object<string, boolean>}
     * @private
     */
    this.externalOpenIds_ = {};
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    if (this.groupBy_) {
      this.groupBy_.init();
      this.groupBy_ = null;
    }

    if (this.lastGroupBy_) {
      this.lastGroupBy_.init();
      this.lastGroupBy_ = null;
    }
  }

  /**
   * Gets the search tree
   *
   * @return {!Array<!ITreeNode>}
   */
  getSearch() {
    return this.search_;
  }

  /**
   * Sets the search tree
   *
   * @param {!Array<!ITreeNode>} value
   */
  setSearch(value) {
    this.search_ = value;
  }

  /**
   * @return {!Object<string, boolean>}
   */
  getOpenIds() {
    /**
     * @type {!Object<string, boolean>}
     */
    var openIds = {};

    if (this.field && this.target && this.target[this.field]) {
      TreeSearch.getOpenIds(openIds,
          /** @type {!Array<!ITreeNode>} */ (this.target[this.field]));
    }

    merge(this.externalOpenIds_, openIds, true);
    return openIds;
  }

  /**
   * @param {Object<string, boolean>} value
   */
  setOpenIds(value) {
    this.externalOpenIds_ = value;
  }

  /**
   * Gets the filter function
   *
   * @return {?function(ITreeNode):boolean}
   */
  getFilterFunction() {
    return this.filterFunc_;
  }

  /**
   * Sets the filter function
   *
   * @param {?function(ITreeNode):boolean} value
   */
  setFilterFunction(value) {
    this.filterFunc_ = value;
  }

  /**
   * Gets the current group by
   *
   * @return {?INodeGroupBy}
   */
  getGroupBy() {
    return this.groupBy_;
  }

  /**
   * Performs a search on the tree
   *
   * @param {!string} term The search term
   * @param {?INodeGroupBy} groupBy
   */
  beginSearch(term, groupBy) {
    var openIds = this.getOpenIds();

    if (!term) {
      term = '*';
    }

    term = '"' + term + '"';

    // set up the results list
    /**
     * @type {!Array<!ITreeNode>}
     */
    var list = [];
    this.groupBy_ = groupBy;

    // if we had a previous group by, clean up the cloned nodes
    if (this.lastGroupBy_) {
      // get the last array of data
      var oldList = /** @type {!Array<!ITreeNode>} */ (this.target[this.field]);

      for (var i = 0, n = oldList.length; i < n; i++) {
        oldList[i].dispose();
      }
    }

    var regStr = TreeSearch.getPattern(term);

    if (groupBy || regStr != '.*' || this.filterFunc_) {
      var exp = new RegExp(regStr, 'gi');

      // add an initial "No Results" node
      this.addNoResult(list);

      // init the grouping
      if (groupBy) {
        groupBy.init();
      }

      // search!
      this.searchIds = {};
      this.searchNodes(exp, list, this.getSearch());
      this.finalizeSearch(this.groupBy_, list);
      this.searchIds = null;

      // clean up the grouping - these are reused so we shouldn't call dispose on them, but we should drop their
      // references to items in the tree
      if (groupBy) {
        groupBy.init();
      }
    } else {
      // no group by and not doing search, so simply make a clone of the search list to merge in
      this.fillListFromSearch(list);
    }

    this.setSort(list);
    TreeSearch.setOpenIds(openIds, list, this.externalOpenIds_);

    this.target[this.field] = list;
    this.lastGroupBy_ = groupBy;
  }

  /**
   * Sets up the sort on the results
   *
   * @param {!Array<!ITreeNode>} list
   */
  setSort(list) {
    if (this.groupBy_) {
      // sort the top level by ID and every other level by label
      list.sort(TreeSearch.idCompare);

      for (var i = 0, n = list.length; i < n; i++) {
        var c = list[i].getChildren();

        if (c) {
          c.sort(TreeSearch.labelCompare);
        }
      }
    } else {
      list.sort(TreeSearch.labelCompare);
    }
  }

  /**
   * Fills the list from the initial search
   *
   * @param {!Array<!ITreeNode>} list
   * @protected
   */
  fillListFromSearch(list) {
    var search = this.getSearch();
    if (search.length > 0) {
      for (var i = 0, n = search.length; i < n; i++) {
        list.push(search[i]);
      }
    } else {
      this.addNoResult(list);
    }
  }

  /**
   * Adds the no result node
   *
   * @param {!Array<!ITreeNode>} list
   * @protected
   */
  addNoResult(list) {
    var node = new SlickTreeNode();
    node.setId(TreeSearch.NO_RESULT_ID);
    node.setLabel(this.noResultLabel_);
    node.setCheckboxVisible(false);
    list.push(node);
  }

  /**
   * Searches the tree
   *
   * @param {RegExp} exp
   * @param {!Array<!ITreeNode>} results
   * @param {Array<!ITreeNode>} nodes
   * @protected
   */
  searchNodes(exp, results, nodes) {
    if (nodes) {
      for (var i = 0, n = nodes.length; i < n; i++) {
        var node = nodes[i];

        if (node && !node.getChildren()) {
          var text = this.getNodeSearchText(node);

          // we'll search the immediate parent as well
          if (node.getParent()) {
            text += this.getNodeSearchText(node.getParent());
          }

          // search
          if (text) {
            var r = exp.test(text);

            if (r) {
              // if we've already seen the same ID for some reason, skip it
              if (node.getId() in this.searchIds) {
                continue;
              }

              // if it passes the filter
              if (!this.filterFunc_ || this.filterFunc_(node)) {
                // remove the "No Result" node
                if (results.length > 0 && results[0].getId() == 'noResults') {
                  results.splice(0, 1);
                }

                // add it to the group by or the list
                if (this.groupBy_) {
                  this.groupBy_.groupBy(node, results);
                } else {
                  results.push(node);
                }
              }
            }

            // reset the regex for the next test
            exp.lastIndex = 0;
          }

          if (!(node.getId() in this.searchIds)) {
            if (this.groupBy_ && (!this.filterFunc_ || this.filterFunc_(node))) {
              this.groupBy_.count(node);
            }

            this.searchIds[node.getId()] = true;
          }
        } else {
          this.searchNodes(exp, results, node.getChildren());
        }
      }
    }
  }

  /**
   * Gets the search text for a node
   *
   * @param {?ITreeNode} node
   * @return {!string}
   */
  getNodeSearchText(node) {
    var t;
    if (node) {
      var s = /** @type {ISearchable} */ (node);

      if (osImplements(s, ISearchable.ID)) {
        t = s.getSearchText();
      } else if (!node.getChildren()) {
        t = node.getLabel();
      }
    }

    return t || '';
  }

  /**
   * Override in inheriting class
   *
   * @param {INodeGroupBy} groupBy
   * @param {!Array} results
   */
  finalizeSearch(groupBy, results) {}

  /**
   * Compares two tree nodes by ID
   *
   * @param {!ITreeNode} a
   * @param {!ITreeNode} b
   * @return {number}
   */
  static idCompare(a, b) {
    return defaultCompare(a.getId(), b.getId());
  }

  /**
   * @param {!string} term
   * @return {!string} pattern
   */
  static getPattern(term) {
    // compile a regex
    var regStr = '.*';
    term = term.toLowerCase();

    if (term != '*' && term != '"*"') {
      var terms = TreeSearch.getTerms(term);

      /**
       * @type {!Array<!string>}
       */
      var regTerms = [];
      for (var i = 0, n = terms.length; i < n; i++) {
        // only allow terms with 3 or more characters
        if (terms[i].length > 2) {
          regTerms.push(regExpEscape(terms[i]));
        }
      }

      if (regTerms.length === 0) {
        // no terms long enough were found, so just search off the first term
        regTerms.push(regExpEscape(terms[0]));
      }

      regStr = '(' + regTerms.join('|') + ')';
    }

    return regStr;
  }

  /**
   * Compares two tree nodes by label
   *
   * @param {!ITreeNode} a
   * @param {!ITreeNode} b
   * @return {number}
   */
  static labelCompare(a, b) {
    // natural sort
    var val = numerateCompare(/** @type {string} */ (a.getLabel()), /** @type {string} */ (b.getLabel()));

    if (val === 0) {
      val = defaultCompare(a.getId(), b.getId()); // lexicographic sort
    }

    return val;
  }

  /**
   * Gets all the open IDs
   *
   * @param {!Object<string, boolean>} ids
   * @param {!Array<!ITreeNode>} list
   * @protected
   */
  static getOpenIds(ids, list) {
    for (var i = 0, n = list.length; i < n; i++) {
      var node = /** @type {SlickTreeNode} */ (list[i]);
      if (node.saveCollapsed) {
        ids[node.getId()] = !node.collapsed;

        var c = node.getChildren();
        if (c) {
          TreeSearch.getOpenIds(ids, c);
        }
      }
    }
  }

  /**
   * Sets the open nodes
   *
   * @param {!Object<string, boolean>} ids The IDs
   * @param {!Array<!ITreeNode>} list The node list
   * @param {Object<string, boolean>} toDo
   * @protected
   */
  static setOpenIds(ids, list, toDo) {
    for (var i = 0, n = list.length; i < n; i++) {
      var node = /** @type {SlickTreeNode} */ (list[i]);
      var id = node.getId();

      if (id in ids) {
        node.collapsed = !ids[id];
        delete toDo[id];
      }

      var c = node.getChildren();
      if (c) {
        TreeSearch.setOpenIds(ids, c, toDo);
      }
    }
  }

  /**
   * Gets search terms from a single string. Parses tokens wrapped in quotes as a single term.
   *
   * @param {string} s The string
   * @return {!Array<!string>} The terms
   */
  static getTerms(s) {
    var i = 0;
    var quoteOpen = false;

    /**
     * @type {!Array<!string>}
     */
    var terms = [];

    if (s) {
      s = s.trim();
      for (var j = 0, n = s.length; j < n; j++) {
        var c = s.charAt(j);

        if (c == '"') {
          if (quoteOpen && j > i) {
            terms.push(s.substring(i, j).trim());
          }

          quoteOpen = !quoteOpen;
          i = j + 1;
        } else if (c.match(/\s/)) {
          if (!quoteOpen) {
            if (j > i) {
              terms.push(s.substring(i, j).trim());
            }

            i = j + 1;
          }
        }
      }

      if (j > i) {
        terms.push(s.substring(i, j).trim());
      }
    }

    return terms;
  }
}

/**
 * Node id for the no results node.
 * @type {string}
 * @const
 */
TreeSearch.NO_RESULT_ID = 'noResults';

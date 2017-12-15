goog.provide('os.ui.slick.TreeSearch');
goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.string');
goog.require('os.data.groupby.INodeGroupBy');
goog.require('os.structs.ITreeNode');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * Tree search allows you to filter a tree and group the results
 * @param {!Array.<!os.structs.ITreeNode>} search The original tree to search
 * @param {!string} setAs The field to set on...
 * @param {Object} onObj this object
 * @param {string=} opt_noResultLabel The label to use when there are no results
 * @extends {goog.Disposable}
 * @constructor
 */
os.ui.slick.TreeSearch = function(search, setAs, onObj, opt_noResultLabel) {
  /**
   * @type {!Array.<!os.structs.ITreeNode>}
   * @private
   */
  this.search_ = search;

  /**
   * @type {!string}
   * @private
   */
  this.field_ = setAs;

  /**
   * @type {Object}
   * @private
   */
  this.target_ = onObj;

  /**
   * @type {?function(os.structs.ITreeNode):boolean}
   * @private
   */
  this.filterFunc_ = null;

  /**
   * @type {!string}
   * @private
   */
  this.noResultLabel_ = opt_noResultLabel || 'No results';

  /**
   * @type {?os.data.groupby.INodeGroupBy}
   * @private
   */
  this.lastGroupBy_ = null;

  /**
   * @type {?os.data.groupby.INodeGroupBy}
   * @private
   */
  this.groupBy_ = null;

  /**
   * @type {?Object.<string, boolean>}
   * @protected
   */
  this.searchIds = null;

  /**
   * @type {Object<string, boolean>}
   * @private
   */
  this.externalOpenIds_ = {};
};
goog.inherits(os.ui.slick.TreeSearch, goog.Disposable);


/**
 * Node id for the no results node.
 * @type {string}
 * @const
 */
os.ui.slick.TreeSearch.NO_RESULT_ID = 'noResults';


/**
 * @inheritDoc
 */
os.ui.slick.TreeSearch.prototype.disposeInternal = function() {
  os.ui.slick.TreeSearch.base(this, 'disposeInternal');

  if (this.groupBy_) {
    this.groupBy_.init();
    this.groupBy_ = null;
  }

  if (this.lastGroupBy_) {
    this.lastGroupBy_.init();
    this.lastGroupBy_ = null;
  }
};


/**
 * Gets the search tree
 * @return {!Array.<!os.structs.ITreeNode>}
 */
os.ui.slick.TreeSearch.prototype.getSearch = function() {
  return this.search_;
};


/**
 * Sets the search tree
 * @param {!Array.<!os.structs.ITreeNode>} value
 */
os.ui.slick.TreeSearch.prototype.setSearch = function(value) {
  this.search_ = value;
};


/**
 * @return {!Object<string, boolean>}
 */
os.ui.slick.TreeSearch.prototype.getOpenIds = function() {
  /**
   * @type {!Object<string, boolean>}
   */
  var openIds = {};

  if (this.field_ && this.target_ && this.target_[this.field_]) {
    os.ui.slick.TreeSearch.getOpenIds(openIds,
        /** @type {!Array.<!os.structs.ITreeNode>} */ (this.target_[this.field_]));
  }

  os.object.merge(this.externalOpenIds_, openIds, true);
  return openIds;
};


/**
 * @param {Object<string, boolean>} value
 */
os.ui.slick.TreeSearch.prototype.setOpenIds = function(value) {
  this.externalOpenIds_ = value;
};


/**
 * Gets the filter function
 * @return {?function(os.structs.ITreeNode):boolean}
 */
os.ui.slick.TreeSearch.prototype.getFilterFunction = function() {
  return this.filterFunc_;
};


/**
 * Sets the filter function
 * @param {?function(os.structs.ITreeNode):boolean} value
 */
os.ui.slick.TreeSearch.prototype.setFilterFunction = function(value) {
  this.filterFunc_ = value;
};


/**
 * Gets the current group by
 * @return {?os.data.groupby.INodeGroupBy}
 */
os.ui.slick.TreeSearch.prototype.getGroupBy = function() {
  return this.groupBy_;
};


/**
 * Performs a search on the tree
 * @param {!string} term The search term
 * @param {?os.data.groupby.INodeGroupBy} groupBy
 */
os.ui.slick.TreeSearch.prototype.beginSearch = function(term, groupBy) {
  var openIds = this.getOpenIds();

  if (!term) {
    term = '*';
  }

  term = '"' + term + '"';

  // set up the results list
  /**
   * @type {!Array.<!os.structs.ITreeNode>}
   */
  var list = [];
  this.groupBy_ = groupBy;

  // if we had a previous group by, clean up the cloned nodes
  if (this.lastGroupBy_) {
    // get the last array of data
    var oldList = /** @type {!Array.<!os.structs.ITreeNode>} */ (this.target_[this.field_]);

    for (var i = 0, n = oldList.length; i < n; i++) {
      oldList[i].dispose();
    }
  }

  var regStr = os.ui.slick.TreeSearch.getPattern(term);

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
    this.searchNodes(exp, list, this.search_);
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
  os.ui.slick.TreeSearch.setOpenIds(openIds, list, this.externalOpenIds_);

  this.target_[this.field_] = list;
  this.lastGroupBy_ = groupBy;
};


/**
 * Compares two tree nodes by ID
 * @param {!os.structs.ITreeNode} a
 * @param {!os.structs.ITreeNode} b
 * @return {number}
 */
os.ui.slick.TreeSearch.idCompare = function(a, b) {
  return goog.array.defaultCompare(a.getId(), b.getId());
};


/**
 * @param {!string} term
 * @return {!string} pattern
 */
os.ui.slick.TreeSearch.getPattern = function(term) {
  // compile a regex
  var regStr = '.*';
  term = term.toLowerCase();

  if (term != '*' && term != '"*"') {
    var terms = os.ui.slick.TreeSearch.getTerms(term);

    /**
     * @type {!Array.<!string>}
     */
    var regTerms = [];
    for (var i = 0, n = terms.length; i < n; i++) {
      // only allow terms with 3 or more characters
      if (terms[i].length > 2) {
        regTerms.push(goog.string.regExpEscape(terms[i]));
      }
    }

    if (regTerms.length === 0) {
      // no terms long enough were found, so just search off the first term
      regTerms.push(goog.string.regExpEscape(terms[0]));
    }

    regStr = '(' + regTerms.join('|') + ')';
  }

  return regStr;
};


/**
 * Compares two tree nodes by label
 * @param {!os.structs.ITreeNode} a
 * @param {!os.structs.ITreeNode} b
 * @return {number}
 */
os.ui.slick.TreeSearch.labelCompare = function(a, b) {
  // natural sort
  var val = goog.string.numerateCompare(/** @type {string} */ (a.getLabel()), /** @type {string} */ (b.getLabel()));

  if (val === 0) {
    val = goog.array.defaultCompare(a.getId(), b.getId()); // lexicographic sort
  }

  return val;
};


/**
 * Sets up the sort on the results
 * @param {!Array.<!os.structs.ITreeNode>} list
 */
os.ui.slick.TreeSearch.prototype.setSort = function(list) {
  if (this.groupBy_) {
    // sort the top level by ID and every other level by label
    list.sort(os.ui.slick.TreeSearch.idCompare);

    for (var i = 0, n = list.length; i < n; i++) {
      var c = list[i].getChildren();

      if (c) {
        c.sort(os.ui.slick.TreeSearch.labelCompare);
      }
    }
  } else {
    list.sort(os.ui.slick.TreeSearch.labelCompare);
  }
};


/**
 * Fills the list from the initial search
 * @param {!Array.<!os.structs.ITreeNode>} list
 * @protected
 */
os.ui.slick.TreeSearch.prototype.fillListFromSearch = function(list) {
  if (this.search_.length > 0) {
    for (var i = 0, n = this.search_.length; i < n; i++) {
      list.push(this.search_[i]);
    }
  } else {
    this.addNoResult(list);
  }
};


/**
 * Adds the no result node
 * @param {!Array.<!os.structs.ITreeNode>} list
 * @protected
 */
os.ui.slick.TreeSearch.prototype.addNoResult = function(list) {
  var node = new os.ui.slick.SlickTreeNode();
  node.setId(os.ui.slick.TreeSearch.NO_RESULT_ID);
  node.setLabel(this.noResultLabel_);
  node.setCheckboxVisible(false);
  list.push(node);
};


/**
 * Searches the tree
 * @param {RegExp} exp
 * @param {!Array.<!os.structs.ITreeNode>} results
 * @param {Array.<!os.structs.ITreeNode>} nodes
 * @protected
 */
os.ui.slick.TreeSearch.prototype.searchNodes = function(exp, results, nodes) {
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
};


/**
 * Gets the search text for a node
 * @param {?os.structs.ITreeNode} node
 * @return {!string}
 */
os.ui.slick.TreeSearch.prototype.getNodeSearchText = function(node) {
  var t;
  if (node) {
    var s = /** @type {os.data.ISearchable} */ (node);

    // throwing exceptions as flow logic is expensive. Check for the method existance instead.
    if (s.getSearchText) {
      t = s.getSearchText();
    } else if (!node.getChildren()) {
      t = node.getLabel();
    }
  }

  return t || '';
};


/**
 * Override in inheriting class
 * @param {os.data.groupby.INodeGroupBy} groupBy
 * @param {!Array} results
 */
os.ui.slick.TreeSearch.prototype.finalizeSearch = function(groupBy, results) {};


/**
 * Gets all the open IDs
 * @param {!Object.<string, boolean>} ids
 * @param {!Array.<!os.structs.ITreeNode>} list
 * @protected
 */
os.ui.slick.TreeSearch.getOpenIds = function(ids, list) {
  for (var i = 0, n = list.length; i < n; i++) {
    var node = /** @type {os.ui.slick.SlickTreeNode} */ (list[i]);
    if (node.saveCollapsed) {
      ids[node.getId()] = !node.collapsed;

      var c = node.getChildren();
      if (c) {
        os.ui.slick.TreeSearch.getOpenIds(ids, c);
      }
    }
  }
};


/**
 * Sets the open nodes
 * @param {!Object<string, boolean>} ids The IDs
 * @param {!Array<!os.structs.ITreeNode>} list The node list
 * @param {Object<string, boolean>} toDo
 * @protected
 */
os.ui.slick.TreeSearch.setOpenIds = function(ids, list, toDo) {
  for (var i = 0, n = list.length; i < n; i++) {
    var node = /** @type {os.ui.slick.SlickTreeNode} */ (list[i]);
    var id = node.getId();

    if (id in ids) {
      node.collapsed = !ids[id];
      delete toDo[id];
    }

    var c = node.getChildren();
    if (c) {
      os.ui.slick.TreeSearch.setOpenIds(ids, c, toDo);
    }
  }
};


/**
 * Gets search terms from a single string. Parses tokens wrapped in quotes as a single term.
 * @param {string} s The string
 * @return {!Array.<!string>} The terms
 */
os.ui.slick.TreeSearch.getTerms = function(s) {
  var i = 0;
  var quoteOpen = false;

  /**
   * @type {!Array.<!string>}
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
};

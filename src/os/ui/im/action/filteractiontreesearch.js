goog.provide('os.ui.im.action.FilterActionTreeSearch');

goog.require('os.im.action.ImportActionManager');
goog.require('os.ui.im.action.FilterActionNode');
goog.require('os.ui.slick.AbstractGroupByTreeSearch');



/**
 * Tree search for filter actions.
 *
 * @extends {os.ui.slick.AbstractGroupByTreeSearch}
 * @param {!string} property The property the search exists at.
 * @param {Object} onObj The object that the search exists on.
 * @param {string=} opt_type Optional filter action type.
 * @constructor
 */
os.ui.im.action.FilterActionTreeSearch = function(property, onObj, opt_type) {
  os.ui.im.action.FilterActionTreeSearch.base(this, 'constructor', [], property, onObj);

  /**
   * @type {string|undefined}
   * @protected
   */
  this.entryType = opt_type;
};
goog.inherits(os.ui.im.action.FilterActionTreeSearch, os.ui.slick.AbstractGroupByTreeSearch);


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionTreeSearch.prototype.beginSearch = function(term, groupBy) {
  var oldSearch = /** @type {!Array<!os.structs.ITreeNode>} */ (this.target[this.field]);
  if (Array.isArray(oldSearch)) {
    // dispose the old nodes, otherwise they will be retained in memory due to listeners on the filter action entries
    oldSearch.forEach(function(node) {
      node.dispose();
    });

    oldSearch.length = 0;
  }

  os.ui.im.action.FilterActionTreeSearch.base(this, 'beginSearch', term, groupBy);
};


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionTreeSearch.prototype.getSearch = function() {
  var entries = os.im.action.ImportActionManager.getInstance().getActionEntries(this.entryType);
  var nodes = [];

  if (entries && entries.length > 0) {
    for (var i = 0, n = entries.length; i < n; i++) {
      nodes.push(this.setupNode(entries[i]));
    }
  }

  return nodes;
};


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionTreeSearch.prototype.setupNode = function(item) {
  return new os.ui.im.action.FilterActionNode(/** @type {!os.im.action.FilterActionEntry} */ (item));
};


/**
 * Overridden to get parents and children as results
 *
 * @override
 */
os.ui.im.action.FilterActionTreeSearch.prototype.searchNodes = function(exp, results, nodes) {
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
};


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionTreeSearch.prototype.fillListFromSearch = function(list) {
  var nodes = this.getSearch();

  if (nodes && nodes.length > 0) {
    for (var i = 0, n = nodes.length; i < n; i++) {
      list.push(nodes[i]);
    }
  } else {
    this.addNoResult(list);
  }
};


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionTreeSearch.prototype.setSort = function(list) {
  if (this.getGroupBy()) {
    // sort the top level by ID and every other level by label
    list.sort(os.ui.slick.TreeSearch.idCompare);

    for (var i = 0, n = list.length; i < n; i++) {
      var c = list[i].getChildren();

      if (c) {
        c.sort(os.ui.slick.TreeSearch.labelCompare);
      }
    }
  }

  // do NOT sort if there isn't a group by
};

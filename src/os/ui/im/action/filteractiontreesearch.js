goog.provide('os.ui.im.action.FilterActionTreeSearch');

goog.require('os.im.action.ImportActionManager');
goog.require('os.ui.im.action.FilterActionNode');
goog.require('os.ui.slick.AbstractGroupByTreeSearch');



/**
 * Tree search for filter actions.
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
os.ui.im.action.FilterActionTreeSearch.prototype.getSearchItems = function() {
  return os.im.action.ImportActionManager.getInstance().getActionEntries(this.entryType);
};


/**
 * @inheritDoc
 */
os.ui.im.action.FilterActionTreeSearch.prototype.setupNode = function(item) {
  return new os.ui.im.action.FilterActionNode(/** @type {!os.im.action.FilterActionEntry} */ (item));
};


/**
 * @override
 */
os.ui.im.action.FilterActionTreeSearch.prototype.fillListFromSearch = function(list) {
  var entries = os.im.action.ImportActionManager.getInstance().getActionEntries(this.entryType);

  if (entries && entries.length > 0) {
    for (var i = 0, n = entries.length; i < n; i++) {
      var node = new os.ui.im.action.FilterActionNode(entries[i]);
      list.push(node);
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

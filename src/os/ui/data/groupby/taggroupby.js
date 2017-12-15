goog.provide('os.ui.data.groupby.TagGroupBy');
goog.require('goog.array');
goog.require('os.data.groupby.BaseGroupBy');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * Groups nodes by tag
 * @extends {os.data.groupby.BaseGroupBy}
 * @param {boolean=} opt_open Keeps groups open by default
 * @constructor
 */
os.ui.data.groupby.TagGroupBy = function(opt_open) {
  os.ui.data.groupby.TagGroupBy.base(this, 'constructor');

  /**
   * @type {boolean}
   * @private
   */
  this.open_ = opt_open || false;
};
goog.inherits(os.ui.data.groupby.TagGroupBy, os.data.groupby.BaseGroupBy);


/**
 * @inheritDoc
 */
os.ui.data.groupby.TagGroupBy.prototype.getGroupIds = function(node) {
  /**
   * @type {Array.<string>}
   */
  var ids = [];
  var tags = null;

  if (node) {
    if (typeof node.getTags === 'function') {
      tags = /** @type {os.data.ISearchable} */ (node).getTags();
    } else if (typeof node.getParent === 'function') {
      var parent = node.getParent();
      if (typeof parent.getTags === 'function') { // try the parent
        tags = /** @type {os.data.ISearchable} */ (parent).getTags();
      }
    }
  }

  if (tags) {
    for (var i = 0, n = tags.length; i < n; i++) {
      goog.array.insert(ids, 'a' + tags[i].toUpperCase());
    }
  }

  if (ids.length === 0) {
    ids.push('zNo Tags');
  }

  return ids;
};


/**
 * @inheritDoc
 */
os.ui.data.groupby.TagGroupBy.prototype.createGroup = function(node, id) {
  var group = new os.ui.slick.SlickTreeNode();
  group.setId(id);
  group.setLabel(id.substring(1));
  group.setCheckboxVisible(false);
  group.collapsed = !this.open_;
  return group;
};

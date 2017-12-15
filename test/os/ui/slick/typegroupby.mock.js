goog.provide('os.ui.MockTypeGroupBy');
goog.require('os.data.groupby.BaseGroupBy');
goog.require('os.ui.slick.SlickTreeNode');
goog.require('goog.array');



/**
 * Groups nodes by type
 * @extends {os.data.groupby.BaseGroupBy}
 * @constructor
 */
os.ui.MockTypeGroupBy = function() {
  goog.base(this);
};
goog.inherits(os.ui.MockTypeGroupBy, os.data.groupby.BaseGroupBy);


/**
 * @inheritDoc
 */
os.ui.MockTypeGroupBy.prototype.getGroupIds = function(node) {
  /**
   * @type {Array.<!string>}
   */
  var ids = [];

  /**
   * @type {?string}
   */
  var val = null;

  try {
    if ('getType' in node) {
      val = node['getType']();
    } else if ('type' in node) {
      val = node['type'];
    }
  } catch (e) {
  }

  if (!val) {
    val = 'No Type';
  }

  goog.array.insert(ids, val);
  return ids;
};


/**
 * @inheritDoc
 */
os.ui.MockTypeGroupBy.prototype.createGroup = function(node, id) {
  var group = new os.ui.slick.SlickTreeNode();
  group.setId(id);
  group.setLabel(id);
  group.setCheckboxVisible(false);
  return group;
};

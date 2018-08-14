goog.provide('os.data.groupby.MockTypeGroupBy');
goog.require('os.data.groupby.BaseGroupBy');
goog.require('os.structs.TriStateTreeNode');
goog.require('goog.array');



/**
 * Groups nodes by type
 * @extends {os.data.groupby.BaseGroupBy}
 * @constructor
 */
os.data.groupby.MockTypeGroupBy = function() {
  goog.base(this);
};
goog.inherits(os.data.groupby.MockTypeGroupBy, os.data.groupby.BaseGroupBy);


/**
 * @inheritDoc
 */
os.data.groupby.MockTypeGroupBy.prototype.getGroupIds = function(node) {
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
os.data.groupby.MockTypeGroupBy.prototype.createGroup = function(node, id) {
  var group = new os.structs.TriStateTreeNode();
  group.setId(id);
  group.setLabel(id);
  return group;
};

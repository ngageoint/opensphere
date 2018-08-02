goog.provide('os.data.groupby.TypeGroupBy');
goog.require('goog.array');
goog.require('os.data.groupby.BaseGroupBy');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * Groups nodes by type
 * @extends {os.data.groupby.BaseGroupBy}
 * @constructor
 */
os.data.groupby.TypeGroupBy = function() {
  os.data.groupby.TypeGroupBy.base(this, 'constructor');
};
goog.inherits(os.data.groupby.TypeGroupBy, os.data.groupby.BaseGroupBy);


/**
 * @inheritDoc
 */
os.data.groupby.TypeGroupBy.prototype.getGroupIds = function(node) {
  /**
   * @type {Array.<!string>}
   */
  var ids = [];

  /**
   * @type {?string}
   */
  var val = null;

  try {
    if (node instanceof os.ui.data.DescriptorNode) {
      var d = /** @type {os.ui.data.DescriptorNode} */ (node).getDescriptor();
      val = d.getType();
    } else if ('getType' in node) {
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
os.data.groupby.TypeGroupBy.prototype.createGroup = function(node, id) {
  var group = new os.ui.slick.SlickTreeNode();
  group.setId(id);
  group.setLabel(id);
  group.setCheckboxVisible(false);
  return group;
};

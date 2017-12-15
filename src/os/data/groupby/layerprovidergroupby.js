goog.provide('os.data.groupby.LayerProviderGroupBy');
goog.require('goog.array');
goog.require('os.data.LayerNode');
goog.require('os.data.groupby.BaseGroupBy');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * Groups layers by provider
 * @extends {os.data.groupby.BaseGroupBy}
 * @constructor
 */
os.data.groupby.LayerProviderGroupBy = function() {
  os.data.groupby.LayerProviderGroupBy.base(this, 'constructor');
};
goog.inherits(os.data.groupby.LayerProviderGroupBy, os.data.groupby.BaseGroupBy);


/**
 * @inheritDoc
 */
os.data.groupby.LayerProviderGroupBy.prototype.getGroupIds = function(node) {
  /**
   * @type {Array.<!string>}
   */
  var ids = [];

  try {
    var layer = /** @type {os.data.LayerNode} */ (node).getLayer();
    var p = layer.getProvider() || 'Unknown Provider';

    goog.array.insert(ids, p);
  } catch (e) {
  }

  return ids;
};


/**
 * @inheritDoc
 */
os.data.groupby.LayerProviderGroupBy.prototype.createGroup = function(node, id) {
  var group = new os.ui.slick.SlickTreeNode();
  group.setId(id);
  group.setLabel(id);
  group.setCheckboxVisible(false);
  group.collapsed = false;
  return group;
};

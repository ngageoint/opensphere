goog.provide('os.data.groupby.LayerZOrderGroupBy');
goog.require('goog.array');
goog.require('goog.string');
goog.require('os.MapContainer');
goog.require('os.data.LayerNode');
goog.require('os.data.groupby.BaseGroupBy');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * Groups layers by z-order
 * @extends {os.data.groupby.BaseGroupBy}
 * @constructor
 */
os.data.groupby.LayerZOrderGroupBy = function() {
  os.data.groupby.LayerZOrderGroupBy.base(this, 'constructor');
};
goog.inherits(os.data.groupby.LayerZOrderGroupBy, os.data.groupby.BaseGroupBy);


/**
 * @inheritDoc
 */
os.data.groupby.LayerZOrderGroupBy.prototype.getGroupIds = function(node) {
  /**
   * @type {Array.<!string>}
   */
  var ids = [];

  try {
    var layer = /** @type {os.data.LayerNode} */ (node).getLayer();
    var layers = os.MapContainer.getInstance().getMap().getLayers().getArray();

    for (var i = 0, n = layers.length; i < n; i++) {
      if (layers[i] instanceof os.layer.Group) {
        var group = /** @type {os.layer.Group} */ (layers[i]);

        if (group.getLayers().getArray().indexOf(/** @type {ol.layer.Base} */ (layer)) > -1) {
          goog.array.insert(ids, goog.string.padNumber(99 - i, 2) + group.getOSType());
          break;
        }
      }
    }
  } catch (e) {
  }

  return ids;
};


/**
 * @inheritDoc
 */
os.data.groupby.LayerZOrderGroupBy.prototype.createGroup = function(node, id) {
  var group = new os.ui.slick.SlickTreeNode();
  group.setId(id);
  group.setLabel(id.substring(2));
  group.setCheckboxVisible(false);
  group.collapsed = false;
  return group;
};

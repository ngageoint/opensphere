goog.provide('os.data.groupby.LayerTypeGroupBy');
goog.require('goog.array');
goog.require('goog.string');
goog.require('os.MapContainer');
goog.require('os.data.LayerNode');
goog.require('os.data.groupby.BaseGroupBy');
goog.require('os.layer.LayerType');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * Groups layers by provider
 * @extends {os.data.groupby.BaseGroupBy}
 * @constructor
 */
os.data.groupby.LayerTypeGroupBy = function() {
  os.data.groupby.LayerTypeGroupBy.base(this, 'constructor');
};
goog.inherits(os.data.groupby.LayerTypeGroupBy, os.data.groupby.BaseGroupBy);


/**
 * @inheritDoc
 */
os.data.groupby.LayerTypeGroupBy.prototype.getGroupIds = function(node) {
  /**
   * @type {Array.<!string>}
   */
  var ids = [];

  try {
    var layer = /** @type {os.data.LayerNode} */ (node).getLayer();
    var layers = os.MapContainer.getInstance().getMap().getLayers().getArray();
    var p = layer.getOSType() || '00Unknown Type';

    for (var i = 0, n = layers.length; i < n; i++) {
      if (layers[i] instanceof os.layer.Group) {
        var group = /** @type {os.layer.Group} */ (layers[i]);

        if (group.getLayers().getArray().indexOf(/** @type {ol.layer.Base} */ (layer)) > -1 ||
            (p == os.layer.LayerType.GROUPS && group.getOSType() == os.layer.LayerType.FEATURES)) {
          var id = goog.string.padNumber(99 - i, 2) + p;
        }
      }
    }

    goog.array.insert(ids, id || p);
  } catch (e) {
  }

  return ids;
};


/**
 * @inheritDoc
 */
os.data.groupby.LayerTypeGroupBy.prototype.createGroup = function(node, id) {
  var group = new os.ui.slick.SlickTreeNode();
  group.setId(id);
  group.setLabel(id.substring(2));
  group.setCheckboxVisible(false);
  group.collapsed = false;
  return group;
};

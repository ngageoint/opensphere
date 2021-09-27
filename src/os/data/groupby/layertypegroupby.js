goog.module('os.data.groupby.LayerTypeGroupBy');

const googArray = goog.require('goog.array');
const googString = goog.require('goog.string');
const BaseGroupBy = goog.require('os.data.groupby.BaseGroupBy');
const Group = goog.require('os.layer.Group');
const LayerType = goog.require('os.layer.LayerType');
const {getMapContainer} = goog.require('os.map.instance');
const {default: SlickTreeNode} = goog.require('os.ui.slick.SlickTreeNode');

const LayerNode = goog.requireType('os.data.LayerNode');


/**
 * Groups layers by provider
 */
class LayerTypeGroupBy extends BaseGroupBy {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  getGroupIds(node) {
    /**
     * @type {Array.<!string>}
     */
    var ids = [];

    try {
      var layer = /** @type {LayerNode} */ (node).getLayer();
      var layers = getMapContainer().getMap().getLayers().getArray();
      var p = layer.getOSType() || '00Unknown Type';

      for (var i = 0, n = layers.length; i < n; i++) {
        if (layers[i] instanceof Group) {
          var group = /** @type {os.layer.Group} */ (layers[i]);

          if (group.getLayers().getArray().indexOf(/** @type {ol.layer.Base} */ (layer)) > -1 ||
              (p == LayerType.GROUPS && group.getOSType() == LayerType.FEATURES)) {
            var id = googString.padNumber(99 - i, 2) + p;
          }
        }
      }

      googArray.insert(ids, id || p);
    } catch (e) {
    }

    return ids;
  }

  /**
   * @inheritDoc
   */
  createGroup(node, id) {
    var group = new SlickTreeNode();
    group.setId(id);
    group.setLabel(id.substring(2));
    group.setCheckboxVisible(false);
    group.collapsed = false;
    return group;
  }
}

exports = LayerTypeGroupBy;

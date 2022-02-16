goog.declareModuleId('os.data.groupby.LayerTypeGroupBy');

import Group from '../../layer/group.js';
import LayerType from '../../layer/layertype.js';
import {getMapContainer} from '../../map/mapinstance.js';
import SlickTreeNode from '../../ui/slick/slicktreenode.js';
import BaseGroupBy from './basegroupby.js';

const googString = goog.require('goog.string');

const {default: LayerNode} = goog.requireType('os.data.LayerNode');


/**
 * Groups layers by provider
 */
export default class LayerTypeGroupBy extends BaseGroupBy {
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
      var id;

      for (var i = 0, n = layers.length; i < n; i++) {
        if (layers[i] instanceof Group) {
          var group = /** @type {Group} */ (layers[i]);

          if (group.getLayers().getArray().indexOf(/** @type {ol.layer.Base} */ (layer)) > -1 ||
              (p == LayerType.GROUPS && group.getOSType() == LayerType.FEATURES)) {
            id = googString.padNumber(99 - i, 2) + p;
          }
        }
      }

      const insertId = id || p;
      if (!ids.includes(insertId)) {
        ids.push(insertId);
      }
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

goog.declareModuleId('os.data.groupby.LayerZOrderGroupBy');

import Group from '../../layer/group.js';
import {getMapContainer} from '../../map/mapinstance.js';
import SlickTreeNode from '../../ui/slick/slicktreenode.js';
import BaseGroupBy from './basegroupby.js';

const googArray = goog.require('goog.array');
const googString = goog.require('goog.string');
const {default: LayerNode} = goog.requireType('os.data.LayerNode');


/**
 * Groups layers by z-order
 */
export default class LayerZOrderGroupBy extends BaseGroupBy {
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

      for (var i = 0, n = layers.length; i < n; i++) {
        if (layers[i] instanceof Group) {
          var group = /** @type {os.layer.Group} */ (layers[i]);

          if (group.getLayers().getArray().indexOf(/** @type {ol.layer.Base} */ (layer)) > -1) {
            googArray.insert(ids, googString.padNumber(99 - i, 2) + group.getOSType());
            break;
          }
        }
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

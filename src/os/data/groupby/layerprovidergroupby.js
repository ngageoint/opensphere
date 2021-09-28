goog.declareModuleId('os.data.groupby.LayerProviderGroupBy');

import SlickTreeNode from '../../ui/slick/slicktreenode.js';
import BaseGroupBy from './basegroupby.js';

const googArray = goog.require('goog.array');
const {default: LayerNode} = goog.requireType('os.data.LayerNode');


/**
 * Groups layers by provider
 */
export default class LayerProviderGroupBy extends BaseGroupBy {
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
      var p = layer.getProvider() || 'Unknown Provider';

      googArray.insert(ids, p);
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
    group.setLabel(id);
    group.setCheckboxVisible(false);
    group.collapsed = false;
    return group;
  }
}

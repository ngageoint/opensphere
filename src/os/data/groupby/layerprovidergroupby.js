goog.module('os.data.groupby.LayerProviderGroupBy');

const googArray = goog.require('goog.array');
const BaseGroupBy = goog.require('os.data.groupby.BaseGroupBy');
const SlickTreeNode = goog.require('os.ui.slick.SlickTreeNode');
const LayerNode = goog.requireType('os.data.LayerNode');


/**
 * Groups layers by provider
 */
class LayerProviderGroupBy extends BaseGroupBy {
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

exports = LayerProviderGroupBy;

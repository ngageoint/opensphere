goog.declareModuleId('os.data.groupby.FavoriteGroupBy');

import SlickTreeNode from '../../ui/slick/slicktreenode.js';
import FavoriteManager from '../../user/settings/favoritemanager.js';
import DataManager from '../datamanager.js';
import BaseGroupBy from './basegroupby.js';


/**
 * Groups nodes by those tagged as a favorite
 */
export default class FavoriteGroupBy extends BaseGroupBy {
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
     * @type {Array.<string>}
     */
    var ids = [];
    try {
      var nodeId = /** @type {string} */ (node.getId());
      if (nodeId) {
        var desc = DataManager.getInstance().getDescriptor(node.getId());
        if (desc && FavoriteManager.getInstance().getFavorite(desc.getId())) {
          ids.push('Favorites');
        } else {
          ids.push('Other');
        }
      } else {
        ids.push('Other');
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
    group.setLabel(id);
    group.setCheckboxVisible(false);
    group.setCollapsed(false);
    return group;
  }
}

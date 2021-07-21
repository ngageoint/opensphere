goog.module('os.data.groupby.FavoriteGroupBy');
goog.module.declareLegacyNamespace();

const DataManager = goog.require('os.data.DataManager');
const BaseGroupBy = goog.require('os.data.groupby.BaseGroupBy');
const SlickTreeNode = goog.require('os.ui.slick.SlickTreeNode');
const FavoriteManager = goog.require('os.user.settings.FavoriteManager');


/**
 * Groups nodes by those tagged as a favorite
 */
class FavoriteGroupBy extends BaseGroupBy {
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

exports = FavoriteGroupBy;

goog.provide('os.data.groupby.FavoriteGroupBy');
goog.require('os.data.groupby.BaseGroupBy');
goog.require('os.ui.slick.SlickTreeNode');
goog.require('os.user.settings.FavoriteManager');



/**
 * Groups nodes by those tagged as a favorite
 * @extends {os.data.groupby.BaseGroupBy}
 * @constructor
 */
os.data.groupby.FavoriteGroupBy = function() {
  os.data.groupby.FavoriteGroupBy.base(this, 'constructor');
};
goog.inherits(os.data.groupby.FavoriteGroupBy, os.data.groupby.BaseGroupBy);


/**
 * @inheritDoc
 */
os.data.groupby.FavoriteGroupBy.prototype.getGroupIds = function(node) {
  /**
   * @type {Array.<string>}
   */
  var ids = [];
  try {
    var nodeId = /** @type {string} */ (node.getId());
    if (nodeId) {
      var desc = os.dataManager.getDescriptor(node.getId());
      if (desc && os.favoriteManager.getFavorite(desc.getId())) {
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
};


/**
 * @inheritDoc
 */
os.data.groupby.FavoriteGroupBy.prototype.createGroup = function(node, id) {
  var group = new os.ui.slick.SlickTreeNode();
  group.setId(id);
  group.setLabel(id);
  group.setCheckboxVisible(false);
  group.setCollapsed(false);
  return group;
};

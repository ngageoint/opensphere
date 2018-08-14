goog.provide('os.ui.query.AreaTreeSearch');
goog.require('os.ui.query.AreaNode');
goog.require('os.ui.slick.AbstractGroupByTreeSearch');



/**
 * Extends AbstractGroupByTreeSearch to search through saved areas
 * @extends {os.ui.slick.AbstractGroupByTreeSearch}
 * @param {!Array.<!os.structs.ITreeNode>} search The original tree to search
 * @param {!string} setAs The field to set on ...
 * @param {Object} onObj this object
 * @param {string=} opt_noResultLabel The label to use when there are no results
 * @constructor
 */
os.ui.query.AreaTreeSearch = function(search, setAs, onObj, opt_noResultLabel) {
  os.ui.query.AreaTreeSearch.base(this, 'constructor', search, setAs, onObj, opt_noResultLabel);
};
goog.inherits(os.ui.query.AreaTreeSearch, os.ui.slick.AbstractGroupByTreeSearch);


/**
 * @inheritDoc
 */
os.ui.query.AreaTreeSearch.prototype.getSearchItems = function() {
  var tree = this.getSearch();
  if (tree) {
    var areas = tree.map(function(item) {
      return item.getArea();
    });
    return areas;
  }
  return [];
};


/**
 * @inheritDoc
 */
os.ui.query.AreaTreeSearch.prototype.setupNode = function(item) {
  var node = new os.ui.query.AreaNode(/** @type {!ol.Feature} */ (item));
  node.setCheckboxVisible(true);
  return node;
};

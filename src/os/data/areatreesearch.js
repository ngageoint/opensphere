goog.provide('os.data.AreaTreeSearch');
goog.require('os.data.AreaNode');
goog.require('os.query.AreaManager');
goog.require('os.ui.slick.AbstractGroupByTreeSearch');



/**
 * Extends AbstractGroupByTreeSearch to search through saved areas
 * @extends {os.ui.slick.AbstractGroupByTreeSearch}
 * @param {!string} setAs The field to set on ...
 * @param {Object} onObj this object
 * @param {string=} opt_noResultLabel The label to use when there are no results
 * @constructor
 */
os.data.AreaTreeSearch = function(setAs, onObj, opt_noResultLabel) {
  os.data.AreaTreeSearch.base(this, 'constructor', [], setAs, onObj, opt_noResultLabel);
};
goog.inherits(os.data.AreaTreeSearch, os.ui.slick.AbstractGroupByTreeSearch);


/**
 * @inheritDoc
 */
os.data.AreaTreeSearch.prototype.getSearchItems = function() {
  return os.ui.areaManager.getAll();
};


/**
 * @inheritDoc
 */
os.data.AreaTreeSearch.prototype.setupNode = function(item) {
  var node = new os.data.AreaNode();
  node.setArea(/** @type {!ol.Feature} */ (item));
  return node;
};


/**
 * Overridden to fill the list from the areas
 * @override
 */
os.data.AreaTreeSearch.prototype.fillListFromSearch = function(list) {
  var areas = os.ui.areaManager.getAll();
  if (areas && areas.length > 0) {
    for (var i = 0, n = areas.length; i < n; i++) {
      list.push(new os.data.AreaNode(areas[i]));
    }
  } else {
    this.addNoResult(list);
  }
};

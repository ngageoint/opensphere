goog.declareModuleId('os.data.AreaTreeSearch');

import * as instance from '../query/queryinstance.js';
import AbstractGroupByTreeSearch from '../ui/slick/abstractgroupbytreesearch.js';
import AreaNode from './areanode.js';


/**
 * Extends AbstractGroupByTreeSearch to search through saved areas
 */
export default class AreaTreeSearch extends AbstractGroupByTreeSearch {
  /**
   * Constructor.
   * @param {!string} setAs The field to set on ...
   * @param {Object} onObj this object
   * @param {string=} opt_noResultLabel The label to use when there are no results
   */
  constructor(setAs, onObj, opt_noResultLabel) {
    super([], setAs, onObj, opt_noResultLabel);
  }

  /**
   * @inheritDoc
   */
  getSearchItems() {
    return instance.getAreaManager().getAll();
  }

  /**
   * @inheritDoc
   */
  setupNode(item) {
    var node = new AreaNode();
    node.setArea(/** @type {!ol.Feature} */ (item));
    return node;
  }

  /**
   * Overridden to fill the list from the areas
   *
   * @override
   */
  fillListFromSearch(list) {
    var areas = instance.getAreaManager().getAll();
    if (areas && areas.length > 0) {
      for (var i = 0, n = areas.length; i < n; i++) {
        list.push(new AreaNode(areas[i]));
      }
    } else {
      this.addNoResult(list);
    }
  }
}

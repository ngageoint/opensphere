goog.declareModuleId('os.ui.query.AreaTreeSearch');

import AbstractGroupByTreeSearch from '../slick/abstractgroupbytreesearch.js';
import AreaNode from './areanode.js';

const {default: ITreeNode} = goog.requireType('os.structs.ITreeNode');


/**
 * Extends AbstractGroupByTreeSearch to search through saved areas
 */
export default class AreaTreeSearch extends AbstractGroupByTreeSearch {
  /**
   * Constructor.
   * @param {!Array<!ITreeNode>} search The original tree to search
   * @param {!string} setAs The field to set on ...
   * @param {Object} onObj this object
   * @param {string=} opt_noResultLabel The label to use when there are no results
   */
  constructor(search, setAs, onObj, opt_noResultLabel) {
    super(search, setAs, onObj, opt_noResultLabel);
  }

  /**
   * @inheritDoc
   */
  getSearchItems() {
    var tree = this.getSearch();
    if (tree) {
      var areas = tree.map(function(item) {
        return item.getArea();
      });
      return areas;
    }
    return [];
  }

  /**
   * @inheritDoc
   */
  setupNode(item) {
    var node = new AreaNode(/** @type {!Feature} */ (item));
    node.setCheckboxVisible(true);
    return node;
  }
}

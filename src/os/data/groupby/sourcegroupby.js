goog.declareModuleId('os.data.groupby.SourceGroupBy');

import FilterNode from '../../ui/filter/ui/filternode.js';
import AreaNode from '../../ui/query/areanode.js';
import {featureKeys} from '../../ui/query/query.js';
import SlickTreeNode from '../../ui/slick/slicktreenode.js';
import RecordField from '../recordfield.js';
import BaseGroupBy from './basegroupby.js';


// this field is used to track areas by source
if (!featureKeys.includes(RecordField.SOURCE_NAME)) {
  featureKeys.push(RecordField.SOURCE_NAME);
}


/**
 * Groups nodes by their source when available.
 */
export default class SourceGroupBy extends BaseGroupBy {
  /**
   * Constructor.
   * @param {boolean=} opt_open Keeps groups open by default
   */
  constructor(opt_open) {
    super();

    /**
     * @type {boolean}
     * @private
     */
    this.open_ = opt_open || false;
  }

  /**
   * @inheritDoc
   */
  getGroupIds(node) {
    var ids = /** @type {Array<string>} */ ([]);
    var sourceName;

    if (node && node instanceof AreaNode) {
      try {
        sourceName = /** @type {string|undefined} */ (node.getArea().get(RecordField.SOURCE_NAME));
      } catch (e) {
        // can't find the source, so use the default group
      }
    }

    if (node && node instanceof FilterNode) {
      try {
        sourceName = /** @type {string|undefined} */ (node.getEntry().getSource());
      } catch (e) {
        // can't find the source, so use the default group
      }
    }

    if (sourceName) {
      ids.push(sourceName);
    } else {
      ids.push('No Associated Source');
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
    group.collapsed = !this.open_;
    return group;
  }
}

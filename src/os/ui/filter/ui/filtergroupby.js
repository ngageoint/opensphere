goog.declareModuleId('os.ui.filter.ui.FilterGroupBy');

import DataManager from '../../../data/datamanager.js';
import BaseGroupBy from '../../../data/groupby/basegroupby.js';
import SlickTreeNode from '../../slick/slicktreenode.js';
import {directiveTag} from './filtergroupui.js';

const {default: FilterNode} = goog.requireType('os.ui.filter.ui.FilterNode');


/**
 * Groups nodes by type
 */
export default class FilterGroupBy extends BaseGroupBy {
  /**
   * Constructor.
   * @param {boolean=} opt_useUi
   */
  constructor(opt_useUi) {
    super();

    /**
     * Whether this groupby will use the filtergroupui
     * @type {boolean}
     * @private
     */
    this.useUi_ = opt_useUi || false;
  }

  /**
   * @inheritDoc
   */
  getGroupIds(node) {
    /**
     * @type {Array<!string>}
     */
    var ids = [];

    /**
     * @type {?string}
     */
    var val = /** @type {FilterNode} */ (node).getEntry().type;

    if (!val) {
      val = 'Unknown';
    } else {
      try {
        var firstHashIdx = val.indexOf('#');
        if (firstHashIdx != -1) {
          val = val.substring(firstHashIdx + 1);
          var secHashIdx = val.indexOf('#');
          if (secHashIdx != -1) {
            val = val.substring(0, secHashIdx);
          }
        }
      } catch (e) {
        // weirdly structured typename
      }
    }

    if (!ids.includes(val)) {
      ids.push(val);
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
    if (this.useUi_) {
      group.setNodeUI(`<${directiveTag}></${directiveTag}>`);
    }

    var dm = DataManager.getInstance();
    var d = dm.getDescriptor(id);

    if (d) {
      group.setLabel(d.getTitle() + ' (' + d.getProvider() + ')');
    }

    return group;
  }
}

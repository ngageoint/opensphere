goog.declareModuleId('os.data.groupby.DateGroupBy');

import DescriptorNode from '../../ui/data/descriptornode.js';
import SlickTreeNode from '../../ui/slick/slicktreenode.js';
import DataManager from '../datamanager.js';
import BaseGroupBy from './basegroupby.js';

const googArray = goog.require('goog.array');
const googString = goog.require('goog.string');


/**
 * Groups nodes by their max date
 */
export default class DateGroupBy extends BaseGroupBy {
  /**
   * Constructor.
   * @param {boolean=} opt_open Whether or not to keep the category open by default
   */
  constructor(opt_open) {
    super();

    /**
     * @type {number}
     * @private
     */
    this.now_ = NaN;

    /**
     * @type {boolean}
     * @private
     */
    this.open_ = opt_open || false;
  }

  /**
   * @inheritDoc
   */
  init() {
    super.init();
    this.now_ = Date.now();
  }

  /**
   * @inheritDoc
   */
  getGroupIds(node) {
    /** @type {Array.<string>} */
    var ids = [];

    var max = Number.NEGATIVE_INFINITY;

    /** @type {os.data.IDataDescriptor} */
    var d = null;

    if (node instanceof DescriptorNode) {
      d = /** @type {DescriptorNode} */ (node).getDescriptor();
    } else {
      var dm = DataManager.getInstance();
      d = dm.getDescriptor(node.getId());
    }

    if (d) {
      max = d.getMaxDate();
    }

    if (!isNaN(max) && max > Number.NEGATIVE_INFINITY) {
      if (max > this.now_) {
        googArray.insert(ids, 'xxReports future activity');
        return ids;
      }

      var p = periods;
      for (var i = 0, n = p.length; i < n; i++) {
        if ((this.now_ - p[i].offset) <= max) {
          googArray.insert(ids, googString.padNumber(i, 2) + p[i].label);
          return ids;
        }
      }

      googArray.insert(ids, 'yyNo recent activity');
      return ids;
    }

    googArray.insert(ids, 'zzCould not determine activity');
    return ids;
  }

  /**
   * @inheritDoc
   */
  createGroup(node, id) {
    var group = new SlickTreeNode();
    group.setId(id);
    group.setLabel(id.substring(2));
    group.setCheckboxVisible(false);

    if (id.indexOf('Last') > -1) {
      group.setToolTip('Contains all results that report activity over the ' + group.getLabel().toLowerCase() + '.');
    } else if (id.indexOf('zz') > -1) {
      group.setToolTip('Contains all results for which the activity could not be determined.');
    } else if (id.indexOf('yy') > -1) {
      group.setToolTip('Contains all results that do not have any recent activity.');
    } else if (id.indexOf('xx') > -1) {
      group.setToolTip('Contains all results that report future activity and thus cannot be accurately binned in' +
          'the other groups');
    }

    group.collapsed = !this.open_;

    return group;
  }
}


/**
 * @type {!Array.<{label: string, offset: number}>}
 */
const periods = [{
  label: 'Last Minute',
  offset: 60 * 1000
}, {
  label: 'Last 5 Minutes',
  offset: 5 * 60 * 1000
}, {
  label: 'Last 15 Minutes',
  offset: 15 * 60 * 1000
}, {
  label: 'Last 30 Minutes',
  offset: 30 * 60 * 1000
}, {
  label: 'Last Hour',
  offset: 60 * 60 * 1000
}, {
  label: 'Last 3 Hours',
  offset: 3 * 60 * 60 * 1000
}, {
  label: 'Last 6 Hours',
  offset: 6 * 60 * 60 * 1000
}, {
  label: 'Last 12 Hours',
  offset: 12 * 60 * 60 * 1000
}, {
  label: 'Last 24 Hours',
  offset: 24 * 60 * 60 * 1000
}, {
  label: 'Last 48 Hours',
  offset: 48 * 60 * 60 * 1000
}, {
  label: 'Last 7 Days',
  offset: 7 * 24 * 60 * 60 * 1000
}, {
  label: 'Last 2 Weeks',
  offset: 14 * 24 * 60 * 60 * 1000
}, {
  label: 'Last 30 Days',
  offset: 30 * 24 * 60 * 60 * 1000
}, {
  label: 'Last 60 Days',
  offset: 60 * 24 * 60 * 60 * 1000
}];

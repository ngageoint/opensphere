goog.declareModuleId('os.data.groupby.RecentGroupBy');

import DescriptorNode from '../../ui/data/descriptornode.js';
import SlickTreeNode from '../../ui/slick/slicktreenode.js';
import BaseGroupBy from './basegroupby.js';

const googArray = goog.require('goog.array');


/**
 * Groups nodes by how recently they have been activated
 */
export default class RecentGroupBy extends BaseGroupBy {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {?Array.<{label: string, time: number}>}
     * @private
     */
    this.times_ = [];

    /**
     * @type {?Date}
     * @private
     */
    this.testDate_ = null;
  }

  /**
   * @inheritDoc
   */
  init() {
    super.init();
    this.times_.length = 0;

    var d = this.testDate_ || new Date();
    d.setHours(0, 0, 0, 0);

    this.times_.push({label: 'Today', time: d.getTime()});
    this.times_.push({label: 'Yesterday', time: d.getTime() - 24 * 60 * 60 * 1000});

    d.setDate(d.getDate() - d.getDay());
    this.times_.push({label: 'This Week', time: d.getTime()});

    d.setDate(d.getDate() - 7);
    this.times_.push({label: 'Last Week', time: d.getTime()});

    d.setDate(d.getDate() - 7);
    this.times_.push({label: '2 Weeks Ago', time: d.getTime()});
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.times_.length = 0;
    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  getGroupIds(node) {
    /**
     * @type {Array.<string>}
     */
    var ids = [];

    /** @type {os.data.IDataDescriptor} */
    var d = null;

    if (node instanceof DescriptorNode) {
      d = /** @type {DescriptorNode} */ (node).getDescriptor();
    }

    if (d) {
      for (var i = 0, n = this.times_.length; i < n; i++) {
        var t = d.getLastActive();
        if (!isNaN(t) && t >= this.times_[i].time) {
          googArray.insert(ids, i + this.times_[i].label);
          return ids;
        }
      }
    }

    return ids;
  }

  /**
   * @inheritDoc
   */
  createGroup(node, id) {
    var group = new SlickTreeNode();
    group.setId(id);
    group.setLabel(id.substring(1));
    group.setCheckboxVisible(false);
    group.setToolTip('All layers activated ' + group.getLabel().toLowerCase());
    return group;
  }
}

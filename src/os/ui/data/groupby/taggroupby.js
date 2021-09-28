goog.declareModuleId('os.ui.data.groupby.TagGroupBy');

import BaseGroupBy from '../../../data/groupby/basegroupby.js';
import SlickTreeNode from '../../slick/slicktreenode.js';

const googArray = goog.require('goog.array');
const log = goog.require('goog.log');

const {default: ISearchable} = goog.requireType('os.data.ISearchable');


/**
 * Groups nodes by tag
 */
export default class TagGroupBy extends BaseGroupBy {
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
    /**
     * @type {Array<string>}
     */
    var ids = [];
    var tags = null;

    if (node) {
      if (typeof node.getTags === 'function') {
        tags = /** @type {ISearchable} */ (node).getTags();
      } else if (typeof node.getParent === 'function') {
        var parent = node.getParent();
        if (typeof parent.getTags === 'function') { // try the parent
          tags = /** @type {ISearchable} */ (parent).getTags();
        }
      }
    }

    if (tags) {
      var invalid = false;
      for (var i = 0, n = tags.length; i < n; i++) {
        if (tags[i]) {
          googArray.insert(ids, 'a' + tags[i].toUpperCase());
        } else {
          invalid = true;
        }
      }
      if (invalid) {
        log.fine(this.log, 'Invalid tag set for ' + node.getLabel() + ': \n' + JSON.stringify(tags));
      }
    }

    if (ids.length === 0) {
      ids.push('zNo Tags');
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
    group.setCheckboxVisible(true);
    group.collapsed = !this.open_;
    return group;
  }
}

goog.declareModuleId('os.data.groupby.BaseGroupBy');

import TreeNode from '../../structs/treenode.js';
import INodeGroupBy from './inodegroupby.js';// eslint-disable-line

const Disposable = goog.require('goog.Disposable');
const log = goog.require('goog.log');

const {default: ITreeNode} = goog.requireType('os.structs.ITreeNode');


/**
 * @implements {INodeGroupBy}
 */
export default class BaseGroupBy extends Disposable {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * Logger
     * @type {log.Logger}
     * @protected
     */
    this.log = logger;

    /**
     * @type {Object.<!string, !ITreeNode>}
     * @private
     */
    this.groupsById_ = null;

    /**
     * @type {Object.<!string, {found: number, total: number}>}
     * @private
     */
    this.countsById_ = null;
  }

  /**
   * @inheritDoc
   */
  init() {
    this.groupsById_ = {};
    this.countsById_ = {};
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.groupsById_ = null;
    this.countsById_ = null;
  }

  /**
   * @inheritDoc
   */
  groupBy(node, results, opt_doCount, opt_skipClone) {
    if (opt_doCount == null) {
      opt_doCount = true;
    }

    var ids = this.getGroupIds(node);
    var group;

    if (ids) {
      for (var i = 0, n = ids.length; i < n; i++) {
        var id = ids[i];
        var child = opt_skipClone ? node : node.clone();

        if (id in this.groupsById_) {
          group = this.groupsById_[id];

          if (group) {
            group.addChild(child, opt_skipClone);
          }
        } else {
          group = this.createGroup(child, id);
          this.groupsById_[id] = group;
          group.addChild(child, opt_skipClone);
          results.push(group);
        }

        if (opt_doCount) {
          if (id in this.countsById_) {
            this.countsById_[id].found++;
          } else {
            this.countsById_[id] = {
              found: 1,
              total: 0
            };
          }

          this.updateText(id);
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  count(node) {
    var ids = this.getGroupIds(node);

    if (ids) {
      for (var i = 0, n = ids.length; i < n; i++) {
        var id = ids[i];
        if (id in this.countsById_) {
          this.countsById_[id].total++;
        } else {
          this.countsById_[id] = {
            found: 0,
            total: 1
          };
        }

        this.updateText(id);
      }
    }
  }

  /**
   * Updates the text on the node for the given ID
   *
   * @param {!string} id
   * @protected
   */
  updateText(id) {
    if (id in this.groupsById_ && id in this.countsById_) {
      var group = this.groupsById_[id];
      var count = this.countsById_[id];

      var label = group.getLabel();
      label = label.replace(/ \(\d+( of \d+)?\)$/, '');
      label += ' (' + count.found + (count.found != count.total ? ' of ' + count.total : '') + ')';
      /** @type {TreeNode} */ (group).setLabel(label);
    }
  }

  /**
   * Get the set of group IDs for the given node
   *
   * @param {!ITreeNode} node
   * @return {Array.<!string>} The IDs
   * @protected
   */
  getGroupIds(node) {
    // extending classes should override this
    return null;
  }

  /**
   * Creates a group from the given node and ID
   *
   * @param {!ITreeNode} node
   * @param {!string} id The ID
   * @return {!ITreeNode} The group
   * @protected
   */
  createGroup(node, id) {
    // extending classes should override this
    return new TreeNode();
  }
}

/**
 * Logger
 * @type {log.Logger}
 */
const logger = log.getLogger('os.data.groupby.BaseGroupBy');

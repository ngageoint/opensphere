goog.module('os.data.groupby.INodeGroupBy');
goog.module.declareLegacyNamespace();

const IDisposable = goog.requireType('goog.disposable.IDisposable');
const ITreeNode = goog.requireType('os.structs.ITreeNode');


/**
 * An interface used to group tree search results
 *
 * @interface
 * @extends {IDisposable}
 */
class INodeGroupBy {
  /**
   * Any initialization should be done here
   */
  init() {}

  /**
   * Adds the node to the proper group or creates it if it does not yet exist
   * @param {!ITreeNode} node
   * @param {!Array.<!os.structs.ITreeNode>} results
   * @param {boolean=} opt_doCount Whether to count this node
   * @param {boolean=} opt_skipClone Whether to skip cloning the node
   */
  groupBy(node, results, opt_doCount, opt_skipClone) {}

  /**
   * Adds to the total count
   * @param {!ITreeNode} node
   */
  count(node) {}
}

exports = INodeGroupBy;

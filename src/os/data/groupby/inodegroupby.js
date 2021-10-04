goog.declareModuleId('os.data.groupby.INodeGroupBy');

const IDisposable = goog.requireType('goog.disposable.IDisposable');
const {default: ITreeNode} = goog.requireType('os.structs.ITreeNode');


/**
 * An interface used to group tree search results
 *
 * @interface
 * @extends {IDisposable}
 */
export default class INodeGroupBy {
  /**
   * Any initialization should be done here
   */
  init() {}

  /**
   * Adds the node to the proper group or creates it if it does not yet exist
   * @param {!ITreeNode} node
   * @param {!Array<!ITreeNode>} results
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

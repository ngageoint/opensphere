goog.declareModuleId('os.structs.ITreeNodeSupplier');

const {default: ITreeNode} = goog.requireType('os.structs.ITreeNode');


/**
 * Interface for classes that provide their own tree node.
 *
 * @interface
 */
export default class ITreeNodeSupplier {
  /**
   * Get a tree node to represent the object.
   * @return {!ITreeNode} The tree node
   */
  getTreeNode() {}
}

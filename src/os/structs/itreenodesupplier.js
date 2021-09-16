goog.module('os.structs.ITreeNodeSupplier');

const ITreeNode = goog.requireType('os.structs.ITreeNode');


/**
 * Interface for classes that provide their own tree node.
 *
 * @interface
 */
class ITreeNodeSupplier {
  /**
   * Get a tree node to represent the object.
   * @return {!ITreeNode} The tree node
   */
  getTreeNode() {}
}

exports = ITreeNodeSupplier;

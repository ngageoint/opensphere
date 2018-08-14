goog.provide('os.structs.ITreeNodeSupplier');



/**
 * Interface for classes that provide their own tree node.
 * @interface
 */
os.structs.ITreeNodeSupplier = function() {};


/**
 * Get a tree node to represent the object.
 * @return {!os.structs.ITreeNode} The tree node
 */
os.structs.ITreeNodeSupplier.prototype.getTreeNode;

goog.provide('os.structs.ITreeNode');
goog.require('goog.disposable.IDisposable');
goog.require('goog.events.Listenable');



/**
 * An interface that describes tree nodes.
 * @interface
 * @extends {goog.disposable.IDisposable}
 * @extends {goog.events.Listenable}
 */
os.structs.ITreeNode = function() {};


/**
 * Gets the ID of the node
 * @return {!string} The node ID
 */
os.structs.ITreeNode.prototype.getId;


/**
 * Sets the ID of the node
 * @param {!string} value The ID
 */
os.structs.ITreeNode.prototype.setId;


/**
 * Gets the label for the node
 * @return {?string} The label
 */
os.structs.ITreeNode.prototype.getLabel;


/**
 * Gets the children of the node
 * @return {?Array<!os.structs.ITreeNode>} The child nodes
 */
os.structs.ITreeNode.prototype.getChildren;


/**
 * Sets the children of the node
 * @param {?Array<!os.structs.ITreeNode>} value The child array
 * @param {boolean=} opt_skipaddparent Whether or not to set the parent of the child argument
 */
os.structs.ITreeNode.prototype.setChildren;


/**
 * Gets the parent node
 * @return {?os.structs.ITreeNode} The parent node, or null if there is no parent
 */
os.structs.ITreeNode.prototype.getParent;


/**
 * Sets the parent node
 * @param {os.structs.ITreeNode} value The new parent
 * @param {boolean=} opt_nocheckparent Whether or not to check to see if this node is in the parent's child list
 */
os.structs.ITreeNode.prototype.setParent;


/**
 * Gets the root node
 * @return {!os.structs.ITreeNode} The root node
 */
os.structs.ITreeNode.prototype.getRoot;


/**
 * Adds a child to the node if it isn't already a child.
 * @param {!os.structs.ITreeNode} child The child node to add
 * @param {boolean=} opt_skipaddparent Whether or not to set the parent of the child argument
 * @param {number=} opt_index Position to insert the child into. If -1 the child will be added
 *    to the end of the children.
 * @return {os.structs.ITreeNode} The added child. May be the passed child, a reference to an existing matching
 *     child, or null if the add failed.
 */
os.structs.ITreeNode.prototype.addChild;


/**
 * Adds children to the node if they aren't already a child.
 * @param {?Array<!os.structs.ITreeNode>} value The child array
 * @param {boolean=} opt_skipaddparent Whether or not to set the parent of the child argument
 * @return {!Array<!os.structs.ITreeNode>} The added children. May be the passed children or a partial list if some
 *                                           children already existed.
 */
os.structs.ITreeNode.prototype.addChildren;


/**
 * Whether or not a parent contains a child
 * @param {!os.structs.ITreeNode} child The child
 * @return {boolean} Whether or not the parent contains the child
 */
os.structs.ITreeNode.prototype.hasChild;


/**
 * Whether or not a parent contains children
 * @return {boolean} Whether or not the parent contains children
 */
os.structs.ITreeNode.prototype.hasChildren;


/**
 * Removes a child from the node
 * @param {!os.structs.ITreeNode} child The child to remove
 * @return {?os.structs.ITreeNode} The node that was removed or null if it was not found.
 */
os.structs.ITreeNode.prototype.removeChild;


/**
 * Removes a child from the node by index
 * @param {number} index The index of the child to remove
 * @return {?os.structs.ITreeNode} The node that was removed or null if it was not found.
 */
os.structs.ITreeNode.prototype.removeChildAt;


/**
 * Returns the first node in the tree that has a field equal to the provided value.
 * @param {string} field Field to search on.
 * @param {*} value Expected value.
 * @return {?os.structs.ITreeNode} First node matching the key/value pair, otherwise null.
 */
os.structs.ITreeNode.prototype.find;


/**
 * Clones the node
 * @return {!os.structs.ITreeNode} The cloned node
 */
os.structs.ITreeNode.prototype.clone;

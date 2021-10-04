goog.declareModuleId('os.structs.ITreeNode');

const IDisposable = goog.requireType('goog.disposable.IDisposable');
const Listenable = goog.requireType('goog.events.Listenable');
const {default: ISearchable} = goog.requireType('os.data.ISearchable');


/**
 * An interface that describes tree nodes.
 *
 * @interface
 * @extends {IDisposable}
 * @extends {Listenable}
 * @extends {ISearchable}
 */
export default class ITreeNode {
  /**
   * Gets the ID of the node
   * @return {!string} The node ID
   */
  getId() {}

  /**
   * Sets the ID of the node
   * @param {!string} value The ID
   */
  setId(value) {}

  /**
   * Gets the label for the node
   * @return {?string} The label
   */
  getLabel() {}

  /**
   * Gets the children of the node
   * @return {?Array<!ITreeNode>} The child nodes
   */
  getChildren() {}

  /**
   * Sets the children of the node
   * @param {?Array<!ITreeNode>} value The child array
   * @param {boolean=} opt_skipaddparent Whether or not to set the parent of the child argument
   */
  setChildren(value, opt_skipaddparent) {}

  /**
   * Gets the parent node
   * @return {?ITreeNode} The parent node, or null if there is no parent
   */
  getParent() {}

  /**
   * Sets the parent node
   * @param {ITreeNode} value The new parent
   * @param {boolean=} opt_nocheckparent Whether or not to check to see if this node is in the parent's child list
   */
  setParent(value, opt_nocheckparent) {}

  /**
   * Gets the root node
   * @return {!ITreeNode} The root node
   */
  getRoot() {}

  /**
   * Adds a child to the node if it isn't already a child.
   * @param {!ITreeNode} child The child node to add
   * @param {boolean=} opt_skipaddparent Whether or not to set the parent of the child argument
   * @param {number=} opt_index Position to insert the child into. If -1 the child will be added
   *    to the end of the children.
   * @return {ITreeNode} The added child. May be the passed child, a reference to an existing matching
   *     child, or null if the add failed.
   */
  addChild(child, opt_skipaddparent, opt_index) {}

  /**
   * Adds children to the node if they aren't already a child.
   * @param {?Array<!ITreeNode>} value The child array
   * @param {boolean=} opt_skipaddparent Whether or not to set the parent of the child argument
   * @return {!Array<!ITreeNode>} The added children. May be the passed children or a partial list if some
   *                                           children already existed.
   */
  addChildren(value, opt_skipaddparent) {}

  /**
   * Whether or not a parent contains a child
   * @param {!ITreeNode} child The child
   * @return {boolean} Whether or not the parent contains the child
   */
  hasChild(child) {}

  /**
   * Whether or not a parent contains children
   * @return {boolean} Whether or not the parent contains children
   */
  hasChildren() {}

  /**
   * Removes a child from the node
   * @param {!ITreeNode} child The child to remove
   * @return {?ITreeNode} The node that was removed or null if it was not found.
   */
  removeChild(child) {}

  /**
   * Removes a child from the node by index
   * @param {number} index The index of the child to remove
   * @return {?ITreeNode} The node that was removed or null if it was not found.
   */
  removeChildAt(index) {}

  /**
   * Returns the first node in the tree that has a field equal to the provided value.
   * @param {string} field Field to search on.
   * @param {*} value Expected value.
   * @return {?ITreeNode} First node matching the key/value pair, otherwise null.
   */
  find(field, value) {}

  /**
   * Clones the node
   * @return {!ITreeNode} The cloned node
   */
  clone() {}
}

/**
 * ID for {@see os.implements}.
 * @const {string}
 */
ITreeNode.ID = 'os.structs.ITreeNode';

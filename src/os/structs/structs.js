goog.module('os.structs');
goog.module.declareLegacyNamespace();

const ITreeNode = goog.requireType('os.structs.ITreeNode');


/**
 * Flattens a tree into a specified array - optionally filtering.
 *
 * @param {ITreeNode} node
 * @param {Array<ITreeNode>} results
 * @param {function(ITreeNode): boolean=} opt_filter
 */
const flattenTree = function(node, results, opt_filter) {
  opt_filter = opt_filter || (() => true);
  if (opt_filter(node)) {
    results.push(node);
  }
  var children = node.getChildren();
  if (children) {
    for (var i = 0, n = children.length; i < n; i++) {
      flattenTree(children[i], results, opt_filter);
    }
  }
};

/**
 * Get the leaf nodes from a root node.
 *
 * @param {T} root The root node to search
 * @return {!(Array<T>|T)}
 * @template T
 */
const getLeafNodes = function(root) {
  var children = root.getChildren();
  if (children && children.length > 0) {
    var leaves = [];
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child) {
        leaves.push(getLeafNodes(child));
      }
    }

    return leaves.flat();
  }

  return root;
};

/**
 * Gets the branch of the tree as an array of nodes starting from the root to this node.
 *
 * @param {ITreeNode} node The current node.
 * @param {Array<!ITreeNode>=} opt_array Optional array to push to.
 * @return {!Array<!ITreeNode>} The branch of the tree.
 */
const getBranch = function(node, opt_array) {
  var branch = opt_array || [];
  branch.unshift(node);

  var parent = node.getParent();
  if (parent) {
    getBranch(parent, branch);
  }

  return branch;
};

/**
 * Gets the index that the node occupies in the parent's children array, or -1 if it's a root node.
 *
 * @param {ITreeNode} node The node.
 * @return {number} The index in the parent's children array.
 */
const getIndexInParent = function(node) {
  var parentIndex = -1;

  var parent = node.getParent();
  if (parent) {
    var children = parent.getChildren();
    parentIndex = children.findIndex(function(child) {
      return child === node;
    });
  }

  return parentIndex;
};

exports = {
  flattenTree,
  getLeafNodes,
  getBranch,
  getIndexInParent
};

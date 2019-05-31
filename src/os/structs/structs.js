goog.provide('os.structs');


/**
 * Flattens a tree into a specified array - optionally filtering.
 * @param {os.structs.ITreeNode} node
 * @param {Array<os.structs.ITreeNode>} results
 * @param {function(os.structs.ITreeNode): boolean=} opt_filter
 */
os.structs.flattenTree = function(node, results, opt_filter) {
  opt_filter = opt_filter || goog.functions.TRUE;
  if (opt_filter(node)) {
    results.push(node);
  }
  var children = node.getChildren();
  if (children) {
    for (var i = 0, n = children.length; i < n; i++) {
      os.structs.flattenTree(children[i], results, opt_filter);
    }
  }
};

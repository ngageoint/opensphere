goog.provide('os.data.groupby.INodeGroupBy');
goog.require('goog.disposable.IDisposable');
goog.require('os.structs.ITreeNode');



/**
 * An interface used to group tree search results
 * @interface
 * @extends {goog.disposable.IDisposable}
 */
os.data.groupby.INodeGroupBy = function() {};


/**
 * Any initialization should be done here
 */
os.data.groupby.INodeGroupBy.prototype.init;


/**
 * Adds the node to the proper group or creates it if it does not yet exist
 * @param {!os.structs.ITreeNode} node
 * @param {!Array.<!os.structs.ITreeNode>} results
 * @param {boolean=} opt_doCount Whether to count this node
 * @param {boolean=} opt_skipClone Whether to skip cloning the node
 */
os.data.groupby.INodeGroupBy.prototype.groupBy;


/**
 * Adds to the total count
 * @param {!os.structs.ITreeNode} node
 */
os.data.groupby.INodeGroupBy.prototype.count;

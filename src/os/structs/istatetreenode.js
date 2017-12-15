goog.provide('os.structs.IStateTreeNode');
goog.require('os.structs.ITreeNode');



/**
 * Extends the base tree node interface to include states (e.g. for tri-state checkbox trees)
 * @interface
 * @extends {os.structs.ITreeNode}
 */
os.structs.IStateTreeNode = function() {};


/**
 * Gets the state of the node
 * @return {string}
 */
os.structs.IStateTreeNode.prototype.getState;


/**
 * Sets the state of the node
 * @param {string} value The state
 */
os.structs.IStateTreeNode.prototype.setState;

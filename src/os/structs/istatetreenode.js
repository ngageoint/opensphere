goog.declareModuleId('os.structs.IStateTreeNode');

const {default: ITreeNode} = goog.requireType('os.structs.ITreeNode');


/**
 * Extends the base tree node interface to include states (e.g. for tri-state checkbox trees)
 *
 * @interface
 * @extends {ITreeNode}
 */
export default class IStateTreeNode {
  /**
   * Gets the state of the node
   * @return {string}
   */
  getState() {}

  /**
   * Sets the state of the node
   * @param {string} value The state
   */
  setState(value) {}
}

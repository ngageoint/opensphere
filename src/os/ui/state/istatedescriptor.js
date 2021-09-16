goog.module('os.ui.state.IStateDescriptor');

const IDataDescriptor = goog.requireType('os.data.IDataDescriptor');
const IUrlDescriptor = goog.requireType('os.data.IUrlDescriptor');


/**
 * Interface for descriptors that act on states
 *
 * @extends {IDataDescriptor}
 * @extends {IUrlDescriptor}
 * @interface
 */
class IStateDescriptor {
  /**
   * Gets the state's load items
   * @return {?Array.<string>}
   */
  getLoadItems() {}

  /**
   * Sets the state's load items
   * @param {?Array.<string>} items The ID to set
   */
  setLoadItems(items) {}

  /**
   * Get the state file type
   * @return {!string}
   */
  getStateType() {}

  /**
   * @return {string} The order:group string that specifies the order in the menu and the group it belongs to.
   *     example: '1:Saved States'
   */
  getMenuGroup() {}

  /**
   * @return {string} The label of the default persister for this state descriptor. Used when saving to default
   *     back to saving a state with the same persister as it used.
   */
  getDefaultPersister() {}
}

/**
 * Interface identifier
 * @const {string}
 */
IStateDescriptor.ID = 'os.ui.data.IStateDescriptor';

exports = IStateDescriptor;

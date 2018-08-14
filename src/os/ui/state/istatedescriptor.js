goog.provide('os.ui.state.IStateDescriptor');

goog.require('os.data.IDataDescriptor');
goog.require('os.data.IUrlDescriptor');



/**
 * Interface for descriptors that act on states
 * @extends {os.data.IDataDescriptor}
 * @extends {os.data.IUrlDescriptor}
 * @interface
 */
os.ui.state.IStateDescriptor = function() {};


/**
 * Interface identifier
 * @const {string}
 */
os.ui.state.IStateDescriptor.ID = 'os.ui.data.IStateDescriptor';


/**
 * Gets the state's load items
 * @return {?Array.<string>}
 */
os.ui.state.IStateDescriptor.prototype.getLoadItems;


/**
 * Sets the state's load items
 * @param {?Array.<string>} items The ID to set
 */
os.ui.state.IStateDescriptor.prototype.setLoadItems;


/**
 * Get the state file type
 * @return {!string}
 */
os.ui.state.IStateDescriptor.prototype.getStateType;


/**
 * @return {string} The order:group string that specifies the order in the menu and the group it belongs to.
 *  example: '1:Saved States'
 */
os.ui.state.IStateDescriptor.prototype.getMenuGroup;

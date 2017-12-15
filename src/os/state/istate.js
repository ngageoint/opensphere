goog.provide('os.state.IState');
goog.require('goog.async.Deferred');



/**
 * @interface
 * @template T,S
 */
os.state.IState = function() {};


/**
 * Get if the state is enabled.
 * @return {boolean} If the state is enabled
 */
os.state.IState.prototype.getEnabled;


/**
 * Set if the state is enabled.
 * @param {boolean} value The new enabled value
 */
os.state.IState.prototype.setEnabled;


/**
 * Get the state title.
 * @return {string} The title
 */
os.state.IState.prototype.getTitle;


/**
 * Get the state description.
 * @return {string} The description
 */
os.state.IState.prototype.getDescription;


/**
 * Get attributes for the state's root object.
 * @return {Object.<string, string>} The root object attributes
 */
os.state.IState.prototype.getRootAttrs;


/**
 * Get the root name for the state object.
 * @return {string} The root name
 */
os.state.IState.prototype.getRootName;


/**
 * Get the saved state.
 * @return {T} The saved state
 */
os.state.IState.prototype.getSavedState;


/**
 * Get the priority of the state. Higher values execute first.
 * @return {number} The state's priority
 */
os.state.IState.prototype.getPriority;


/**
 * Load the given state.
 * @param {T|string} obj The state object to load
 * @param {string} id The ID of the current state
 * @param {?string=} opt_title Optional title/name of the state
 */
os.state.IState.prototype.load;


/**
 * Write the current state.
 * @param {S} options Save options
 * @return {!goog.async.Deferred} A promise that resolves when the state has been written.
 */
os.state.IState.prototype.save;


/**
 * Removes the given state.
 * @param {string} id The state ID to remove
 */
os.state.IState.prototype.remove;

goog.provide('os.ui.action.IActionTarget');



/**
 * @interface
 */
os.ui.action.IActionTarget = function() {};


/**
 * Calls the function associated with the provided action.
 * @param {string} type
 */
os.ui.action.IActionTarget.prototype.callAction;


/**
 * If the class supports the given action type.
 * @param {string} type The action type.
 * @param {*=} opt_actionArgs Data passed along with the action event, provides context to this action of what else
 *   is involved in a multiselect
 * @return {boolean}
 */
os.ui.action.IActionTarget.prototype.supportsAction;

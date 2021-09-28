goog.declareModuleId('os.ui.action.IActionTarget');

/**
 * @interface
 */
export default class IActionTarget {
  /**
   * Calls the function associated with the provided action.
   * @param {string} type
   */
  callAction(type) {}

  /**
   * If the class supports the given action type.
   * @param {string} type The action type.
   * @param {*=} opt_actionArgs Data passed along with the action event, provides context to this action of what else
   *   is involved in a multiselect
   * @return {boolean}
   */
  supportsAction(type, opt_actionArgs) {}
}

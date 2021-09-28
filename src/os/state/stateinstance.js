goog.declareModuleId('os.state.instance');

const {assert} = goog.require('goog.asserts');

const {default: BaseStateManager} = goog.requireType('os.state.BaseStateManager');


/**
 * The global state manager instance.
 * @type {BaseStateManager}
 */
let stateManager = null;

/**
 * Get the global state manager instance.
 * @return {!BaseStateManager}
 */
export const getStateManager = () => {
  assert(stateManager != null, 'StateManager instance is not defined! Use setStateManager to set the instance.');
  return stateManager;
};

/**
 * Set the global state manager instance.
 * @param {BaseStateManager} value The instance.
 */
export const setStateManager = (value) => {
  stateManager = value;
};

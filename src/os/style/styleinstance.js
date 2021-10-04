goog.declareModuleId('os.style.instance');

const {assert} = goog.require('goog.asserts');

const {default: StyleManager} = goog.requireType('os.style.StyleManager');


/**
 * The global style manager instance.
 * @type {StyleManager}
 */
let styleManager = null;

/**
 * Get the global style manager instance.
 * @return {!StyleManager}
 */
export const getStyleManager = () => {
  assert(styleManager != null, 'StyleManager instance is not defined! Use setStyleManager to set the instance.');
  return styleManager;
};

/**
 * Set the global style manager instance.
 * @param {StyleManager} value The instance.
 */
export const setStyleManager = (value) => {
  styleManager = value;
};

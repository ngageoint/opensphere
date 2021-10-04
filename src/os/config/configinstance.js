goog.declareModuleId('os.config.instance');

const {assert} = goog.require('goog.asserts');

const {default: Settings} = goog.requireType('os.config.Settings');


/**
 * The global Settings instance.
 * @type {Settings}
 */
let settings;

/**
 * Get the global Settings instance.
 * @param {boolean=} opt_skipAssert If the null check assertion should be skipped. Use during initialization only.
 * @return {Settings}
 */
export const getSettings = (opt_skipAssert = false) => {
  assert(opt_skipAssert || settings != null, 'Settings instance is not defined! Use setSettings to set the instance.');
  return settings;
};

/**
 * Set the global Settings instance.
 * @param {Settings} value The instance.
 */
export const setSettings = (value) => {
  settings = value;
};

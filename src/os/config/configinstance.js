goog.module('os.config.instance');

const {assert} = goog.require('goog.asserts');

const Settings = goog.requireType('os.config.Settings');


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
const getSettings = (opt_skipAssert = false) => {
  assert(opt_skipAssert || settings != null, 'Settings instance is not defined! Use setSettings to set the instance.');
  return settings;
};

/**
 * Set the global Settings instance.
 * @param {Settings} value The instance.
 */
const setSettings = (value) => {
  settings = value;
};

exports = {
  getSettings,
  setSettings
};

goog.module('plugin.suncalc');

/**
 * Suncalc identifier.
 * @type {string}
 */
const ID = 'suncalc';

/**
 * The base settings key for the plugin.
 * @type {string}
 */
const BASE_SETTING_KEY = 'plugin.suncalc';


/**
 * Settings keys for the plugin.
 * @enum {string}
 */
const SettingKey = {
  DUSK_MODE: BASE_SETTING_KEY + '.duskMode'
};

/**
 * Modes for displaying dusk duration in the timeline.
 * @enum {string}
 */
const duskMode = {
  CIVILIAN: 'civilian',
  NAUTICAL: 'nautical',
  ASTRONOMICAL: 'astronomical'
};

exports = {
  ID,
  BASE_SETTING_KEY,
  SettingKey,
  duskMode
};

goog.declareModuleId('plugin.suncalc');

/**
 * Suncalc identifier.
 * @type {string}
 */
export const ID = 'suncalc';

/**
 * The base settings key for the plugin.
 * @type {string}
 */
export const BASE_SETTING_KEY = 'plugin.suncalc';

/**
 * Settings keys for the plugin.
 * @enum {string}
 */
export const SettingKey = {
  DUSK_MODE: BASE_SETTING_KEY + '.duskMode'
};

/**
 * Modes for displaying dusk duration in the timeline.
 * @enum {string}
 */
export const duskMode = {
  CIVILIAN: 'civilian',
  NAUTICAL: 'nautical',
  ASTRONOMICAL: 'astronomical'
};

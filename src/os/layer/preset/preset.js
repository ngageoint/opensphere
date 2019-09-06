goog.provide('os.layer.preset');
goog.provide('os.layer.preset.SettingKey');



/**
 * Base settings key for default import actions.
 * @type {string}
 * @const
 */
os.layer.preset.BASE_KEY = 'layer.preset.';


/**
 * Settings keys for default import actions.
 * @enum {string}
 */
os.layer.preset.SettingKey = {
  PRESETS: os.layer.preset.BASE_KEY + 'presets'
};


/**
 * Default ID value for presets in commands. Used for undo/redo.
 * @type {string}
 * @const
 */
os.layer.preset.DEFAULT_PRESET_ID = '__default__';

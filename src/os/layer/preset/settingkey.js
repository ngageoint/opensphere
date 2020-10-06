goog.module('os.layer.preset.SettingKey');
goog.module.declareLegacyNamespace();

const {BASE_KEY} = goog.require('os.layer.preset');


/**
 * Settings keys for layer presets.
 * @enum {string}
 */
exports = {
  APPLIED_DEFAULTS: BASE_KEY + 'appliedDefaults',
  PRESETS: BASE_KEY + 'presets'
};

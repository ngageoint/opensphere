goog.module('os.config.DisplaySettings');
goog.module.declareLegacyNamespace();

const {directiveTag: settingsUi} = goog.require('os.config.DisplaySettingsUI');
const SettingPlugin = goog.require('os.ui.config.SettingPlugin');


/**
 * Display settings plugin.
 */
class DisplaySettings extends SettingPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.setLabel('Display');
    this.setCategories(['Map']);
    this.setDescription('Start application in 2D or 3D mode');
    this.setTags(['2D', '3D', 'Dimension']);
    this.setIcon('fa fa-dashboard');
    this.setUI(settingsUi);
  }
}

exports = DisplaySettings;

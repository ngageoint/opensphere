goog.module('os.config.AreaSettings');
goog.module.declareLegacyNamespace();

const {directiveTag: settingsUi} = goog.require('os.config.AreaSettingsUI');
const SettingPlugin = goog.require('os.ui.config.SettingPlugin');


/**
 * Area settings plugin.
 */
class AreaSettings extends SettingPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.setLabel('Areas');
    this.setCategories(['Map']);
    this.setDescription('Options for Areas');
    this.setTags(['areas', 'color', 'width']);
    this.setIcon('fa fa-globe');
    this.setUI(settingsUi);
  }
}

exports = AreaSettings;

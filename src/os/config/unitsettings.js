goog.module('os.config.UnitSettings');
goog.module.declareLegacyNamespace();

const {directiveTag: settingsUi} = goog.require('os.config.UnitSettingsUI');
const SettingPlugin = goog.require('os.ui.config.SettingPlugin');


/**
 */
class UnitSettings extends SettingPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.setLabel('Units');
    this.setCategories(['Map']);
    this.setDescription('Units of Measure');
    this.setTags(['Metric', 'Imperial', 'Nautical']);
    this.setIcon('fa fa-calculator');
    this.setUI(settingsUi);
  }
}

exports = UnitSettings;

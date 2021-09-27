goog.module('os.config.UnitSettings');

const {directiveTag: settingsUi} = goog.require('os.config.UnitSettingsUI');
const {default: SettingPlugin} = goog.require('os.ui.config.SettingPlugin');


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

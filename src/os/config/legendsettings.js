goog.module('os.config.LegendSettings');

const {ICON, ID} = goog.require('os.legend');
const {directiveTag: settingsUi} = goog.require('os.config.LegendSettingsUI');
const SettingPlugin = goog.require('os.ui.config.SettingPlugin');


/**
 * Legend settings plugin.
 */
class LegendSettings extends SettingPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.setLabel('Legend');
    this.setCategories(['Map']);
    this.setDescription('Settings for the map legend');
    this.setIcon('fa ' + ICON);
    this.setUI(settingsUi);
  }

  /**
   * @inheritDoc
   */
  getId() {
    return ID;
  }
}

exports = LegendSettings;

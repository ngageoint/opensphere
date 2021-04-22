goog.module('plugin.suncalc.LightStripSettings');

const SettingPlugin = goog.require('os.ui.config.SettingPlugin');
const {directiveTag: uiEl} = goog.require('plugin.suncalc.LightStripSettingsUI');


/**
 * Settings plugin for the light strip.
 */
class LightStripSettings extends SettingPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.setLabel('Light Strip');
    this.setCategories(['Map']);
    this.setDescription('Twilight calculation settings');
    this.setTags(['twilight', 'lightstrip']);
    this.setIcon('fa fa-sun-o');
    this.setUI(uiEl);
  }
}

exports = LightStripSettings;

goog.declareModuleId('plugin.suncalc.LightStripSettings');

import {directiveTag as uiEl} from './lightstripsettingsui.js';

const SettingPlugin = goog.require('os.ui.config.SettingPlugin');

/**
 * Settings plugin for the light strip.
 */
export default class LightStripSettings extends SettingPlugin {
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

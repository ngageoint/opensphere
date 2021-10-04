goog.declareModuleId('os.config.LegendSettings');

import {ICON, ID} from '../legend/legend.js';
import SettingPlugin from '../ui/config/settingplugin.js';
import {directiveTag as settingsUi} from './legendsettingsui.js';


/**
 * Legend settings plugin.
 */
export default class LegendSettings extends SettingPlugin {
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

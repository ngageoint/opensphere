goog.declareModuleId('os.config.UnitSettings');

import SettingPlugin from '../ui/config/settingplugin.js';
import {directiveTag as settingsUi} from './unitsettingsui.js';


/**
 */
export default class UnitSettings extends SettingPlugin {
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

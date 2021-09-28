goog.declareModuleId('os.config.DisplaySettings');

import SettingPlugin from '../ui/config/settingplugin.js';
import {directiveTag as settingsUi} from './displaysettingsui.js';


/**
 * Display settings plugin.
 */
export default class DisplaySettings extends SettingPlugin {
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

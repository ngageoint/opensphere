goog.declareModuleId('os.config.AreaSettings');

import SettingPlugin from '../ui/config/settingplugin.js';
import {directiveTag as settingsUi} from './areasettingsui.js';


/**
 * Area settings plugin.
 */
export default class AreaSettings extends SettingPlugin {
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

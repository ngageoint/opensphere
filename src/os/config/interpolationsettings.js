goog.declareModuleId('os.config.InterpolationSettings');

import SettingPlugin from '../ui/config/settingplugin.js';
import {directiveTag as settingsUi} from './interpolationsettingsui.js';


/**
 */
export default class InterpolationSettings extends SettingPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.setLabel('Interpolation');
    this.setCategories(['Map']);
    this.setDescription('Interpolation settings for line/polygon segments');
    this.setTags(['interpolation', 'line', 'polygon', 'render']);
    this.setIcon('fa fa-ellipsis-h');
    this.setUI(settingsUi);
  }
}

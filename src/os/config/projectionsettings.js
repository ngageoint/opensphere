goog.declareModuleId('os.config.ProjectionSettings');

import SettingPlugin from '../ui/config/settingplugin.js';
import {directiveTag as settingsUi} from './projectionsettingsui.js';


/**
 * Projection settings plugin.
 */
export default class ProjectionSettings extends SettingPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.setLabel('Projection');
    this.setCategories(['Map']);
    this.setDescription('The base projection for the application');
    this.setTags(['projection', 'epsg', 'mercator', 'geographic']);
    this.setIcon('fa fa-map-o');
    this.setUI(settingsUi);
  }
}

goog.declareModuleId('os.ui.user.settings.LocationSettings');

import SettingPlugin from '../../config/settingplugin.js';
import {directiveTag as settingsUi} from './locationsettingsui.js';


/**
 */
export default class LocationSettings extends SettingPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.setLabel('Location Format');
    this.setDescription('Set Your Location Format');
    this.setTags(['Latitude', 'Longitude']);
    this.setIcon('fa fa-location-arrow');
    this.setUI(settingsUi);
  }
}

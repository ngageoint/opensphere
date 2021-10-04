goog.declareModuleId('os.bearing.BearingSettings');

import SettingPlugin from '../ui/config/settingplugin.js';
import * as bearing from './bearing.js';
import {directiveTag as settingsUi} from './bearingsettingsui.js';


/**
 * Settings plugin for controlling bearing settings. When it is instantiated, it lazy loads the geomagnetic
 * data needed for calculating magnetic north bearings.
 */
export default class BearingSettings extends SettingPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.setLabel('Bearing');
    this.setCategories(['Map']);
    this.setDescription('Choose whether bearings are displayed with as true north or magnetic north');
    this.setTags(['bearing', 'north', 'true', 'magnetic']);
    this.setIcon('fa fa-compass');
    this.setUI(settingsUi);

    bearing.loadGeomag();
  }
}

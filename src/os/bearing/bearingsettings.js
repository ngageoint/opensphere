goog.module('os.bearing.BearingSettings');

const bearing = goog.require('os.bearing');
const {directiveTag: settingsUi} = goog.require('os.bearing.BearingSettingsUI');
const SettingPlugin = goog.require('os.ui.config.SettingPlugin');


/**
 * Settings plugin for controlling bearing settings. When it is instantiated, it lazy loads the geomagnetic
 * data needed for calculating magnetic north bearings.
 */
class BearingSettings extends SettingPlugin {
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

exports = BearingSettings;

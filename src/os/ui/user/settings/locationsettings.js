goog.module('os.ui.user.settings.LocationSettings');
goog.module.declareLegacyNamespace();

const {directiveTag: settingsUi} = goog.require('os.ui.user.settings.LocationSettingsUI');
const SettingPlugin = goog.require('os.ui.config.SettingPlugin');

/**
 */
class LocationSettings extends SettingPlugin {
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

exports = LocationSettings;

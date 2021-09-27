goog.module('os.config.ProjectionSettings');

const {directiveTag: settingsUi} = goog.require('os.config.ProjectionSettingsUI');
const {default: SettingPlugin} = goog.require('os.ui.config.SettingPlugin');


/**
 * Projection settings plugin.
 */
class ProjectionSettings extends SettingPlugin {
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

exports = ProjectionSettings;

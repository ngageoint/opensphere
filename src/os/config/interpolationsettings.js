goog.module('os.config.InterpolationSettings');

const {directiveTag: settingsUi} = goog.require('os.config.InterpolationSettingsUI');
const {default: SettingPlugin} = goog.require('os.ui.config.SettingPlugin');


/**
 */
class InterpolationSettings extends SettingPlugin {
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

exports = InterpolationSettings;

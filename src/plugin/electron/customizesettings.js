goog.declareModuleId('plugin.electron.CustomizeSettings');

const SettingPlugin = goog.require('os.ui.config.SettingPlugin');
const {directiveTag: settingsUi} = goog.require('plugin.electron.CustomizeSettingsUI');


/**
 * Settings plugin to control which config files are loaded by the application.
 */
export default class CustomizeSettings extends SettingPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.setLabel('Customize Settings');
    this.setDescription('Manage which settings files are loaded by the application');
    this.setTags(['settings']);
    this.setIcon('fas fa-cogs');
    this.setUI(settingsUi);
  }
}

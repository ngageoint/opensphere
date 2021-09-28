goog.module('os.file.FileSettings');

const {directiveTag} = goog.require('os.file.FileSettingsUI');
const {default: SettingPlugin} = goog.require('os.ui.config.SettingPlugin');


/**
 */
class FileSettings extends SettingPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.setLabel('Files');
    this.setDescription('Configure your file preferences.');
    this.setTags(['files']);
    this.setIcon('fa fa-file-text-o');
    this.setUI(directiveTag);
  }
}

exports = FileSettings;

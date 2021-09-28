goog.declareModuleId('os.file.FileSettings');

import SettingPlugin from '../ui/config/settingplugin.js';
import {directiveTag} from './filesettingsui.js';


/**
 */
export default class FileSettings extends SettingPlugin {
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

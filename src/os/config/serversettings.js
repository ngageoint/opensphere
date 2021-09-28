goog.declareModuleId('os.config.ServerSettings');

import SettingPlugin from '../ui/config/settingplugin.js';
import {directiveTag} from '../ui/servers.js';


/**
 */
export default class ServerSettings extends SettingPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.setLabel('Data Servers');
    this.setDescription('Add and configure data servers');
    this.setTags(['servers', 'data', 'provider']);
    this.setIcon('fa fa-database');
    this.setUI(directiveTag);
  }

  /**
   * @inheritDoc
   */
  getId() {
    return ServerSettings.ID;
  }
}


/**
 * @type {string}
 * @const
 */
ServerSettings.ID = 'servers';

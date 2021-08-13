goog.module('os.config.ServerSettings');
goog.module.declareLegacyNamespace();

const {directiveTag} = goog.require('os.ui.ServersUI');
const SettingPlugin = goog.require('os.ui.config.SettingPlugin');


/**
 */
class ServerSettings extends SettingPlugin {
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


exports = ServerSettings;

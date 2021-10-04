goog.declareModuleId('os.ui.ProviderImportUI');

import DataManager from '../data/datamanager.js';
import FileParserConfig from '../parse/fileparserconfig.js';
import FileImportUI from './im/fileimportui.js';
import * as osWindow from './window.js';


/**
 */
export default class ProviderImportUI extends FileImportUI {
  /**
   * Constructor.
   * @param {string} ui The directive to launch
   */
  constructor(ui) {
    super();

    // file contents are only used in memory, not loaded from storage
    this.requiresStorage = false;

    /**
     * @type {string}
     */
    this.ui = ui;
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    super.launchUI(file, opt_config);

    var config = new FileParserConfig();

    // if an existing config was provided, merge it in
    if (opt_config) {
      this.mergeConfig(opt_config, config);
    }

    var type = opt_config ? opt_config['type'] : file ? file.getType() : null;
    var entry = DataManager.getInstance().getProviderEntry(type);

    if (this.ui) {
      var provider = opt_config ? opt_config.provider : null;

      if (provider) {
        config['provider'] = provider;
        config['enabled'] = provider.getEnabled();
      } else {
        config['file'] = file;
        config['label'] = file.getFileName();
        config['enabled'] = true;
      }

      var scopeOptions = {
        'config': config
      };
      var windowOptions = {
        'label': (provider ? provider.getEditable() ? 'Edit ' : 'View ' : 'Add ') + entry.title,
        'icon': 'fa fa-database',
        'x': 'center',
        'y': 'center',
        'width': '500',
        'min-width': '350',
        'max-width': '600',
        'height': 'auto',
        'min-height': '250',
        'max-height': '500',
        'modal': 'true',
        'show-close': 'true'
      };
      osWindow.create(windowOptions, this.ui, undefined, undefined, undefined, scopeOptions);
    } else {
      // todo log some stuff, man
    }
  }
}

goog.declareModuleId('plugin.georss.GeoRSSImportUI');

import './georssimport.js';

import FileParserConfig from 'opensphere/src/os/parse/fileparserconfig.js';
import FileImportUI from 'opensphere/src/os/ui/im/fileimportui.js';
import {create} from 'opensphere/src/os/ui/window.js';


/**
 * GeoRSS import UI.
 */
export default class GeoRSSImportUI extends FileImportUI {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  // Let's be honest, testing getters like this is pedantic. Let's ignore it
  // this time.
  /* istanbul ignore next */
  /**
   * @inheritDoc
   */
  getTitle() {
    return 'GeoRSS';
  }

  // TODO: This function doesn't do much yet, after it does, let's test the
  // finished product.
  /* istanbul ignore next */
  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    super.launchUI(file, opt_config);

    const config = new FileParserConfig();

    // if an existing config was provided, merge it in
    if (opt_config) {
      this.mergeConfig(opt_config, config);
    }

    config['file'] = file;
    config['title'] = file.getFileName();

    const scopeOptions = {
      'config': config
    };
    const windowOptions = {
      'label': 'Import GeoRSS',
      'icon': 'fa fa-file-text',
      'x': 'center',
      'y': 'center',
      'width': 350,
      'min-width': 350,
      'max-width': 600,
      'height': 'auto',
      'modal': true,
      'show-close': true
    };
    const template = '<georssimport></georssimport>';
    create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
}

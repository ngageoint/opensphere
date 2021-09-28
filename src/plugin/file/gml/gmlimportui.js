goog.declareModuleId('plugin.file.gml.GMLImportUI');

import {directiveTag as gmlImportUi} from './gmlimport.js';
import GMLParserConfig from './gmlparserconfig.js';

const FileImportUI = goog.require('os.ui.im.FileImportUI');
const osWindow = goog.require('os.ui.window');

/**
 * @extends {FileImportUI.<GMLParserConfig>}
 */
export default class GMLImportUI extends FileImportUI {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  getTitle() {
    return 'GML';
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    super.launchUI(file, opt_config);

    var config = new GMLParserConfig();

    // if an existing config was provided, merge it in
    if (opt_config) {
      this.mergeConfig(opt_config, config);
    }

    config['file'] = file;
    config['title'] = file.getFileName();

    var scopeOptions = {
      'config': config
    };
    var windowOptions = {
      'label': 'Import GML',
      'icon': 'fa fa-file-text',
      'x': 'center',
      'y': 'center',
      'width': 400,
      'min-width': 400,
      'max-width': 800,
      'height': 'auto',
      'modal': true,
      'show-close': true
    };
    var template = `<${gmlImportUi}></${gmlImportUi}>`;
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
}

goog.declareModuleId('plugin.file.zip.ui.ZIPImportUI');

import ZIPParserConfig from '../zipparserconfig.js';
import {directiveTag as zipImportUi} from './zipimport.js';

const FileImportUI = goog.require('os.ui.im.FileImportUI');
const osWindow = goog.require('os.ui.window');
const windowSelector = goog.require('os.ui.windowSelector');

/**
 * @extends {FileImportUI.<ZIPParserConfig>}
 */
export default class ZIPImportUI extends FileImportUI {
  /**
   * Constructor.
   */
  constructor() {
    super();

    // file contents are only used in memory, not loaded from storage
    this.requiresStorage = false;
  }

  /**
   * @inheritDoc
   */
  getTitle() {
    return 'ZIP';
  }

  /**
   * @inheritDoc
   */
  launchUI(file, opt_config) {
    super.launchUI(file, opt_config);

    var config = new ZIPParserConfig();

    // if a configuration was provided, merge it in
    if (opt_config) {
      this.mergeConfig(opt_config, config);
    }

    config['file'] = file; // set the file

    var scopeOptions = {
      'config': config
    };
    var windowOptions = {
      'label': 'ZIP Import',
      'icon': 'fa fa-sign-in',
      'x': 'center',
      'y': 'center',
      'width': '650',
      'min-width': '500',
      'max-width': '1200',
      'height': '360',
      'min-height': '300',
      'max-height': '1000',
      'modal': 'true',
      'show-close': 'true'
    };
    var template = `<${zipImportUi} resize-with="${windowSelector.WINDOW}"></${zipImportUi}>`;
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
}

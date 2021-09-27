goog.declareModuleId('plugin.file.gpx.ui.GPXImportUI');

import FileImportUI from '../../../../os/ui/im/fileimportui.js';
import * as osWindow from '../../../../os/ui/window.js';
import {directiveTag as gpxImportUi} from './gpximport.js';

const FileParserConfig = goog.require('os.parse.FileParserConfig');


/**
 */
export default class GPXImportUI extends FileImportUI {
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
    return 'GPX';
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

    config['file'] = file;
    config['title'] = file.getFileName();

    var scopeOptions = {
      'config': config
    };
    var windowOptions = {
      'label': 'Import GPX',
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
    var template = `<${gpxImportUi}></${gpxImportUi}>`;
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }
}

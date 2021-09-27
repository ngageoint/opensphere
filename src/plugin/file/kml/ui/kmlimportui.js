goog.declareModuleId('plugin.file.kml.ui.KMLImportUI');

import FileImportUI from '../../../../os/ui/im/fileimportui.js';
import * as osWindow from '../../../../os/ui/window.js';
import KMLDescriptor from '../kmldescriptor.js';
import KMLProvider from '../kmlprovider.js';
import {directiveTag as importEl} from './kmlimport.js';

const DataManager = goog.require('os.data.DataManager');
const FileDescriptor = goog.require('os.data.FileDescriptor');
const FileParserConfig = goog.require('os.parse.FileParserConfig');


/**
 */
export default class KMLImportUI extends FileImportUI {
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
    return 'KML';
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

    if (opt_config && opt_config['defaultImport']) {
      this.handleDefaultImport(file, config);
      return;
    }

    var scopeOptions = {
      'config': config
    };
    var windowOptions = {
      'label': 'Import KML',
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

    var template = `<${importEl}></${importEl}>`;
    osWindow.create(windowOptions, template, undefined, undefined, undefined, scopeOptions);
  }

  /**
   * @inheritDoc
   */
  handleDefaultImport(file, config) {
    config = this.getDefaultConfig(file, config);

    // create the descriptor and add it
    if (config) {
      const provider = KMLProvider.getInstance();
      const descriptor = new KMLDescriptor();
      FileDescriptor.createFromConfig(descriptor, provider, config);

      provider.addDescriptor(descriptor);
      DataManager.getInstance().addDescriptor(descriptor);
      descriptor.setActive(true);
    }
  }
}

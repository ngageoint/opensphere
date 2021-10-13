goog.declareModuleId('plugin.georss.GeoRSSImportUI');

import DataManager from 'opensphere/src/os/data/datamanager.js';
import DescriptorEvent from 'opensphere/src/os/data/descriptorevent.js';
import DescriptorEventType from 'opensphere/src/os/data/descriptoreventtype.js';
import * as Dispatcher from 'opensphere/src/os/dispatcher.js';
import FileParserConfig from 'opensphere/src/os/parse/fileparserconfig.js';
import FileImportUI from 'opensphere/src/os/ui/im/fileimportui.js';

import {createFromConfig} from './georssdescriptor.js';
import GeoRSSProvider from './georssprovider.js';


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

  /**
   * @inheritDoc
   */
  getTitle() {
    return 'GeoRSS';
  }

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

    const descriptor = createFromConfig(config);

    // add the descriptor to the data manager first
    DataManager.getInstance().addDescriptor(descriptor);

    // followed by the provider
    GeoRSSProvider.getInstance().addDescriptor(descriptor);

    if (descriptor.isActive()) {
      Dispatcher.getInstance().dispatchEvent(new DescriptorEvent(DescriptorEventType.USER_TOGGLED, descriptor));
    }
  }
}

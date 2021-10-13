goog.declareModuleId('plugin.tileserver.TileserverPlugin');

import ConfigDescriptor from 'opensphere/src/os/data/configdescriptor.js';
import DataManager from 'opensphere/src/os/data/datamanager.js';
import ProviderEntry from 'opensphere/src/os/data/providerentry.js';
import AbstractPlugin from 'opensphere/src/os/plugin/abstractplugin.js';
import PluginManager from 'opensphere/src/os/plugin/pluginmanager.js';

import Tileserver from './tileserver.js';
import {ID} from './index.js';

/**
 * Provides Tileserver support
 */
export default class TileserverPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = ID;
    this.errorMessage = null;
  }

  /**
   * @inheritDoc
   */
  init() {
    const dm = DataManager.getInstance();
    dm.registerProviderType(new ProviderEntry(
        ID, // the type
        Tileserver, // the class
        'Tileserver', // the title
        'Tileserver layers' // the description
    ));

    dm.registerDescriptorType(ID, ConfigDescriptor);
  }
}

// add the plugin to the application
PluginManager.getInstance().addPlugin(new TileserverPlugin());

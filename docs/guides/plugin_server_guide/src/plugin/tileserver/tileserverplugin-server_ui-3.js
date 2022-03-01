goog.declareModuleId('plugin.tileserver.TileserverPlugin');

import './mime.js';

import ConfigDescriptor from 'opensphere/src/os/data/configdescriptor.js';
import DataManager from 'opensphere/src/os/data/datamanager.js';
import ProviderEntry from 'opensphere/src/os/data/providerentry.js';
import AbstractPlugin from 'opensphere/src/os/plugin/abstractplugin.js';
import PluginManager from 'opensphere/src/os/plugin/pluginmanager.js';
import ImportManager from 'opensphere/src/os/ui/im/importmanager.js';
import ProviderImportUI from 'opensphere/src/os/ui/providerimportui.js';

import Tileserver from './tileserver.js';
import {directiveTag as importUi, formDirectiveTag as formUi} from './tileserverimport.js';
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

    const im = ImportManager.getInstance();
    // The argument to ProviderImportUI is the directive. A simple one like this will
    // be expanded under the hood to '<tileserver></tileserver>'. However, you can
    // define your own full markup and pass it in if you like.
    im.registerImportUI(ID, new ProviderImportUI(importUi));

    // Register the server type with the import manager so it will appear in the Add Server UI.
    im.registerServerType(ID, {
      type: ID,
      formUi,
      label: 'Tileserver'
    });
  }
}

// add the plugin to the application
PluginManager.getInstance().addPlugin(new TileserverPlugin());

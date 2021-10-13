goog.declareModuleId('plugin.georss.GeoRSSPlugin');

import DataManager from 'opensphere/src/os/data/datamanager.js';
import ProviderEntry from 'opensphere/src/os/data/providerentry.js';
import LayerConfigManager from 'opensphere/src/os/layer/config/layerconfigmanager.js';
import AbstractPlugin from 'opensphere/src/os/plugin/abstractplugin.js';
import PluginManager from 'opensphere/src/os/plugin/pluginmanager.js';
import ImportManager from 'opensphere/src/os/ui/im/importmanager.js';

import {ID} from './georss.js';
import GeoRSSImportUI from './georssimportui.js';
import GeoRSSLayerConfig from './georsslayerconfig.js';
import GeoRSSProvider from './georssprovider.js';
import {TYPE} from './mime.js';

/**
 * Provides support for the GeoRSS format.
 */
export default class GeoRSSPlugin extends AbstractPlugin {
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
    const lcm = LayerConfigManager.getInstance();
    lcm.registerLayerConfig(ID, GeoRSSLayerConfig);

    const im = ImportManager.getInstance();
    im.registerImportDetails('GeoRSS', true);
    im.registerImportUI(TYPE, new GeoRSSImportUI());

    // register georss provider type
    const dm = DataManager.getInstance();
    const title = 'GeoRSS Layers';
    dm.registerProviderType(new ProviderEntry(
        ID, // the type
        GeoRSSProvider, // the class
        title, // the title
        title // the description
    ));
  }
}

// add the plugin to the application
PluginManager.getInstance().addPlugin(new GeoRSSPlugin());

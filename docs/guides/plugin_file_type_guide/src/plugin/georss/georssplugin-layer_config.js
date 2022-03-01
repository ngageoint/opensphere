goog.declareModuleId('plugin.georss.GeoRSSPlugin');

import LayerConfigManager from 'opensphere/src/os/layer/config/layerconfigmanager.js';
import AbstractPlugin from 'opensphere/src/os/plugin/abstractplugin.js';
import PluginManager from 'opensphere/src/os/plugin/pluginmanager.js';

import {ID} from './georss.js';
import GeoRSSLayerConfig from './georsslayerconfig.js';

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
  }
}

// add the plugin to the application
PluginManager.getInstance().addPlugin(new GeoRSSPlugin());

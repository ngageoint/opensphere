goog.declareModuleId('plugin.georss.GeoRSSPlugin');

import AbstractPlugin from 'opensphere/src/os/plugin/abstractplugin.js';
import PluginManager from 'opensphere/src/os/plugin/pluginmanager.js';

import {ID} from './georss.js';

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
    // plugin does not do anything yet
  }
}

// add the plugin to the application
PluginManager.getInstance().addPlugin(new GeoRSSPlugin());

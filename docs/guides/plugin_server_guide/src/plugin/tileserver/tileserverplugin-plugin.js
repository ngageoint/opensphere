goog.declareModuleId('plugin.tileserver.TileserverPlugin');

import AbstractPlugin from 'opensphere/src/os/plugin/abstractplugin.js';
import PluginManager from 'opensphere/src/os/plugin/pluginmanager.js';

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
    // our plugin doesn't do anything yet
  }
}

// add the plugin to the application
PluginManager.getInstance().addPlugin(new TileserverPlugin());

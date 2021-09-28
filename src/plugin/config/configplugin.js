goog.declareModuleId('plugin.config.Plugin');

import {ID} from './config.js';
import Provider from './configprovider.js';

const ConfigDescriptor = goog.require('os.data.ConfigDescriptor');
const DataManager = goog.require('os.data.DataManager');
const ProviderEntry = goog.require('os.data.ProviderEntry');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');

/**
 * Provides config support
 */
export default class Plugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    const dm = DataManager.getInstance();

    dm.registerProviderType(new ProviderEntry(
        ID, Provider, 'config Provider',
        'config servers provide layers through layer configs'));

    dm.registerDescriptorType(ConfigDescriptor.ID, ConfigDescriptor);
  }

  /**
   * Get the global instance.
   * @return {!Plugin}
   */
  static getInstance() {
    if (!instance) {
      instance = new Plugin();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {Plugin} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {Plugin|undefined}
 */
let instance;

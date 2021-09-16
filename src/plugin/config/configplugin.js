goog.module('plugin.config.Plugin');

const ConfigDescriptor = goog.require('os.data.ConfigDescriptor');
const DataManager = goog.require('os.data.DataManager');
const ProviderEntry = goog.require('os.data.ProviderEntry');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const config = goog.require('plugin.config');
const Provider = goog.require('plugin.config.Provider');


/**
 * Provides config support
 */
class Plugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = config.ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    const dm = DataManager.getInstance();

    dm.registerProviderType(new ProviderEntry(
        config.ID, Provider, 'config Provider',
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

exports = Plugin;

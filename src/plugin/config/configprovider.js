goog.module('plugin.config.Provider');
goog.module.declareLegacyNamespace();

const log = goog.require('goog.log');
const Settings = goog.require('os.config.Settings');
const {ProviderKey} = goog.require('os.data');
const BaseDescriptor = goog.require('os.data.BaseDescriptor');
const ConfigDescriptor = goog.require('os.data.ConfigDescriptor');
const DataManager = goog.require('os.data.DataManager');
const DataProviderEvent = goog.require('os.data.DataProviderEvent');
const DataProviderEventType = goog.require('os.data.DataProviderEventType');
const IDataProvider = goog.require('os.data.IDataProvider');
const DescriptorProvider = goog.require('os.ui.data.DescriptorProvider');
const {ID} = goog.require('plugin.config');

const Logger = goog.requireType('goog.log.Logger');
const IDataDescriptor = goog.requireType('os.data.IDataDescriptor');


/**
 * The configuration provider provides access to configuration sources.
 *
 * @implements {IDataProvider}
 */
class Provider extends DescriptorProvider {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.log = logger;
    this.setId(ID);

    /**
     * Map of layer group ID to the layer configs.
     * @type {!Object<string, (Array<Object>|Object)>}
     * @private
     */
    this.layers_ = {};

    /**
     * The base provider key for settings.
     * @type {ProviderKey}
     * @private
     */
    this.providerKey_ = ProviderKey.USER;
  }

  /**
   * @inheritDoc
   */
  configure(config) {
    super.configure(config);
    this.setToolTip(/** @type {?string} */ (config['tooltip'] || config['description']));
    this.layers_ = /** @type {Object} */ (config['layers']) || {};
    this.providerKey_ = /** @type {ProviderKey} */ (config['providerKey']) || ProviderKey.USER;
    this.listInServers = config['listInServers'] != null ? /** @type {boolean} */ (config['listInServers']) : true;
  }

  /**
   * @inheritDoc
   */
  load(ping) {
    this.dispatchEvent(new DataProviderEvent(DataProviderEventType.LOADING, this));
    this.setChildren(null);

    for (var id in this.layers_) {
      this.loadConfig(id, this.layers_[id]);
    }

    this.dispatchEvent(new DataProviderEvent(DataProviderEventType.LOADED, this));
  }

  /**
   * @inheritDoc
   */
  removeDescriptor(descriptor, opt_clear) {
    var result = super.removeDescriptor(descriptor, opt_clear);

    var id = descriptor.getId();
    var configId = id.replace(this.getId() + BaseDescriptor.ID_DELIMITER, '');
    if (configId && configId in this.layers_) {
      delete this.layers_[configId];

      var settingsKey = this.getSettingsKey() + '.layers';
      Settings.getInstance().set(settingsKey, this.layers_);
    }

    return result;
  }

  /**
   * Load a layer config.
   * @param {string} id The layer id.
   * @param {Object|Array<Object>} config The layer config(s) to load.
   * @return {IDataDescriptor} The descriptor, or null if one could not be found/created.
   * @protected
   */
  loadConfig(id, config) {
    var descriptor = null;

    try {
      var descriptorId = this.getId() + BaseDescriptor.ID_DELIMITER + id;
      descriptor = /** @type {ConfigDescriptor} */ (DataManager.getInstance().getDescriptor(descriptorId));

      if (!descriptor) {
        descriptor = new ConfigDescriptor();
        descriptor.setId(descriptorId);
      }

      this.fixId(descriptorId, config);

      descriptor.setBaseConfig(config);
      DataManager.getInstance().addDescriptor(descriptor);
      this.addDescriptor(descriptor, false, false);
    } catch (e) {
      log.error(this.log, 'There was an error processing the configuration', e);
    }

    return descriptor;
  }

  /**
   * Ensure layer config id's are prefixed with the descriptor id.
   * @param {string} id The descriptor id.
   * @param {Array<Object>|Object} config The layer config(s).
   * @protected
   */
  fixId(id, config) {
    if (Array.isArray(config)) {
      config.forEach(this.fixId.bind(this, id));
    } else if (config) {
      if (!('id' in config)) {
        throw new Error('Config for "' + id + '" does not contain the "id" field!');
      }
      if (!config['id'].startsWith(id)) {
        config['id'] = id + BaseDescriptor.ID_DELIMITER + config['id'];
      }
    }
  }

  /**
   * Get the settings key for the provider.
   * @return {string} The key.
   * @protected
   */
  getSettingsKey() {
    return this.providerKey_ + '.' + this.getId();
  }

  /**
   * Add a layer group to the provider and create a descriptor.
   * @param {string} id The layer group id.
   * @param {Array<Object>|Object} config The layer config(s) to add to the group.
   * @return {IDataDescriptor} The descriptor. If `id` is already registered with the provider, the existing
   *                                   descriptor will be returned.
   */
  addLayerGroup(id, config) {
    var descriptor = null;

    if (config) {
      if (!(id in this.layers_)) {
        this.layers_[id] = config;

        var layersKey = this.getSettingsKey() + '.layers';
        Settings.getInstance().set(layersKey, this.layers_);

        descriptor = this.loadConfig(id, config);
      } else {
        var descriptorId = [this.getId(), id].join(BaseDescriptor.ID_DELIMITER);
        descriptor = DataManager.getInstance().getDescriptor(descriptorId);
      }
    }

    return descriptor;
  }

  /**
   * @inheritDoc
   */
  getErrorMessage() {
    return null;
  }

  /**
   * Create a new config provider, or return it if it already exists.
   * @param {string} id The provider id.
   * @param {Object} config The provider config.
   * @return {Provider} The provider.
   */
  static create(id, config) {
    var provider = null;

    if (id && config) {
      provider = /** @type {Provider} */ (DataManager.getInstance().getProvider(id));

      if (!provider) {
        // ensure the type is set properly, and layers are defined
        config['type'] = ID;

        if (!config['layers']) {
          config['layers'] = {};
        }

        provider = new Provider();
        provider.setId(id);
        provider.configure(config);
        provider.load();

        Settings.getInstance().set(provider.getSettingsKey(), config);
        DataManager.getInstance().addProvider(provider);
      }
    }

    return provider;
  }
}
os.implements(Provider, IDataProvider.ID);

/**
 * The logger.
 * @type {Logger}
 */
const logger = log.getLogger('plugin.config.Provider');

exports = Provider;

goog.provide('plugin.config.Provider');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.MapEvent');
goog.require('os.data');
goog.require('os.data.BaseDescriptor');
goog.require('os.data.ConfigDescriptor');
goog.require('os.data.DataManager');
goog.require('os.data.DataProviderEvent');
goog.require('os.data.DataProviderEventType');
goog.require('os.data.IDataProvider');
goog.require('os.map');
goog.require('os.proj.switch');
goog.require('os.ui.data.DescriptorNode');
goog.require('os.ui.data.DescriptorProvider');
goog.require('plugin.basemap');
goog.require('plugin.basemap.BaseMapDescriptor');
goog.require('plugin.basemap.TerrainDescriptor');
goog.require('plugin.basemap.layer.BaseMap');



/**
 * The base map provider provides access to pre-configured map layers
 *
 * @implements {os.data.IDataProvider}
 * @extends {os.ui.data.DescriptorProvider}
 * @constructor
 * @see {@link plugin.basemap.BaseMapPlugin} for configuration instructions
 */
plugin.config.Provider = function() {
  plugin.config.Provider.base(this, 'constructor');

  this.log = plugin.config.Provider.LOGGER_;
  this.setId(plugin.config.ID);

  /**
   * Map of layer group ID to the layer configs.
   * @type {!Object<string, (Array<Object>|Object)>}
   * @private
   */
  this.layers_ = {};

  /**
   * The base provider key for settings.
   * @type {os.data.ProviderKey}
   * @private
   */
  this.providerKey_ = os.data.ProviderKey.USER;
};
goog.inherits(plugin.config.Provider, os.ui.data.DescriptorProvider);
os.implements(plugin.config.Provider, os.data.IDataProvider.ID);


/**
 * The logger.
 * @const
 * @type {goog.debug.Logger}
 * @private
 */
plugin.config.Provider.LOGGER_ = goog.log.getLogger('plugin.config.Provider');


/**
 * @inheritDoc
 */
plugin.config.Provider.prototype.configure = function(config) {
  plugin.config.Provider.base(this, 'configure', config);
  this.setToolTip(/** @type {?string} */ (config['tooltip'] || config['description']));
  this.layers_ = /** @type {Object} */ (config['layers']) || {};
  this.providerKey_ = /** @type {os.data.ProviderKey} */ (config['providerKey']) || os.data.ProviderKey.USER;
};


/**
 * @inheritDoc
 */
plugin.config.Provider.prototype.load = function(ping) {
  this.dispatchEvent(new os.data.DataProviderEvent(os.data.DataProviderEventType.LOADING, this));
  this.setChildren(null);

  for (var id in this.layers_) {
    this.loadConfig(id, this.layers_[id]);
  }

  this.dispatchEvent(new os.data.DataProviderEvent(os.data.DataProviderEventType.LOADED, this));
};


/**
 * @inheritDoc
 */
plugin.config.Provider.prototype.removeDescriptor = function(descriptor, opt_clear) {
  var result = plugin.config.Provider.base(this, 'removeDescriptor', descriptor, opt_clear);

  var id = descriptor.getId();
  var configId = id.replace(this.getId() + os.data.BaseDescriptor.ID_DELIMITER, '');
  if (configId && configId in this.layers_) {
    delete this.layers_[configId];

    var settingsKey = this.getSettingsKey() + '.layers';
    os.settings.set(settingsKey, this.layers_);
  }

  return result;
};


/**
 * Load a layer config.
 * @param {string} id The layer id.
 * @param {Object|Array<Object>} config The layer config(s) to load.
 * @return {os.data.IDataDescriptor} The descriptor, or null if one could not be found/created.
 * @protected
 */
plugin.config.Provider.prototype.loadConfig = function(id, config) {
  var descriptor = null;

  try {
    var descriptorId = this.getId() + os.data.BaseDescriptor.ID_DELIMITER + id;
    descriptor = /** @type {os.data.ConfigDescriptor} */ (os.dataManager.getDescriptor(descriptorId));

    if (!descriptor) {
      descriptor = new os.data.ConfigDescriptor();
      descriptor.setId(descriptorId);
    }

    this.fixId(descriptorId, config);

    descriptor.setBaseConfig(config);
    os.dataManager.addDescriptor(descriptor);
    this.addDescriptor(descriptor, false, false);
  } catch (e) {
    goog.log.error(this.log, 'There was an error processing the configuration', e);
  }

  return descriptor;
};


/**
 * Ensure layer config id's are prefixed with the descriptor id.
 * @param {string} id The descriptor id.
 * @param {Array<Object>|Object} config The layer config(s).
 * @protected
 */
plugin.config.Provider.prototype.fixId = function(id, config) {
  if (Array.isArray(config)) {
    config.forEach(this.fixId.bind(this, id));
  } else if (config) {
    if (!('id' in config)) {
      throw new Error('Config for "' + id + '" does not contain the "id" field!');
    }
    if (!config['id'].startsWith(id)) {
      config['id'] = id + os.data.BaseDescriptor.ID_DELIMITER + config['id'];
    }
  }
};


/**
 * Get the settings key for the provider.
 * @return {string} The key.
 * @protected
 */
plugin.config.Provider.prototype.getSettingsKey = function() {
  return this.providerKey_ + '.' + this.getId();
};


/**
 * Add a layer group to the provider and create a descriptor.
 * @param {string} id The layer group id.
 * @param {Array<Object>|Object} config The layer config(s) to add to the group.
 * @return {os.data.IDataDescriptor} The descriptor. If `id` is already registered with the provider, the existing
 *                                   descriptor will be returned.
 */
plugin.config.Provider.prototype.addLayerGroup = function(id, config) {
  var descriptor = null;

  if (config) {
    if (!(id in this.layers_)) {
      this.layers_[id] = config;

      var layersKey = this.getSettingsKey() + '.layers';
      os.settings.set(layersKey, this.layers_);

      descriptor = this.loadConfig(id, config);
    } else {
      var descriptorId = [this.getId(), id].join(os.data.BaseDescriptor.ID_DELIMITER);
      descriptor = os.dataManager.getDescriptor(descriptorId);
    }
  }

  return descriptor;
};


/**
 * @inheritDoc
 */
plugin.config.Provider.prototype.getErrorMessage = function() {
  return null;
};


/**
 * Create a new config provider, or return it if it already exists.
 * @param {string} id The provider id.
 * @param {Object} config The provider config.
 * @return {plugin.config.Provider} The provider.
 */
plugin.config.Provider.create = function(id, config) {
  var provider = null;

  if (id && config) {
    provider = /** @type {plugin.config.Provider} */ (os.dataManager.getProvider(id));

    if (!provider) {
      // ensure the type is set properly, and layers are defined
      config['type'] = plugin.config.ID;

      if (!config['layers']) {
        config['layers'] = {};
      }

      provider = new plugin.config.Provider();
      provider.setId(id);
      provider.configure(config);
      provider.load();

      os.settings.set(provider.getSettingsKey(), config);
      os.dataManager.addProvider(provider);
    }
  }

  return provider;
};

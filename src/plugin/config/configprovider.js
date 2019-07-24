goog.provide('plugin.config.Provider');

goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.MapEvent');
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
   * @type {Object|Array<Object>}
   * @private
   */
  this.layers_;
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
  this.layers_ = /** @type {Object} */ (config['layers']);
};


/**
 * @inheritDoc
 */
plugin.config.Provider.prototype.load = function(ping) {
  this.dispatchEvent(new os.data.DataProviderEvent(os.data.DataProviderEventType.LOADING, this));
  this.setChildren(null);

  if (this.layers_) {
    for (var id in this.layers_) {
      this.loadConfig(id, this.layers_[id]);
    }
  }

  this.dispatchEvent(new os.data.DataProviderEvent(os.data.DataProviderEventType.LOADED, this));
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
    var fullId = this.getId() + os.data.BaseDescriptor.ID_DELIMITER + id;
    descriptor = /** @type {os.data.ConfigDescriptor} */ (os.dataManager.getDescriptor(fullId));

    if (!descriptor) {
      descriptor = new os.data.ConfigDescriptor();
    }

    this.fixId(fullId, config);
    this.addIcons(config);

    descriptor.setBaseConfig(config);
    os.dataManager.addDescriptor(descriptor);
    this.addDescriptor(descriptor, false, false);
  } catch (e) {
    goog.log.error(this.log, 'There was an error processing the configuration', e);
  }

  return descriptor;
};


/**
 * Get the settings key for the provider.
 * @return {string} The key.
 */
plugin.config.Provider.prototype.getSettingsKey = function() {
  return 'userProviders.' + this.getId();
};


/**
 * Add a layer group to the provider and create a descriptor.
 * @param {string} groupId The layer group id.
 * @param {Object|Array<Object>} config The layer config(s) to add to the group.
 * @return {os.data.IDataDescriptor} The descriptor. If `groupId` is already registered with the provider, the existing
 *                                   descriptor will be returned.
 */
plugin.config.Provider.prototype.addLayerGroup = function(groupId, config) {
  var fullId = this.getId() + os.data.BaseDescriptor.ID_DELIMITER + groupId;
  var descriptor = os.dataManager.getDescriptor(fullId);
  if (descriptor) {
    return descriptor;
  }

  if (!this.layers_) {
    this.layers_ = {};
  }

  if (!(groupId in this.layers_)) {
    this.layers_[groupId] = config;

    // save a copy of the config from settings, so changes made by loadConfig aren't persisted
    var layersKey = this.getSettingsKey() + '.layers';
    os.settings.set(layersKey + '.' + groupId, os.object.unsafeClone(config));

    descriptor = this.loadConfig(groupId, config);
  }

  return descriptor;
};


/**
 * @param {string} fullId
 * @param {Object|Array} conf
 * @protected
 */
plugin.config.Provider.prototype.fixId = function(fullId, conf) {
  if (Array.isArray(conf)) {
    conf.forEach(this.fixId.bind(this, fullId));
  } else {
    if (!('id' in conf)) {
      throw new Error('Config for "' + fullId + '" does not contain the "id" field!');
    }
    // ensure this isn't done more than once
    var prefix = fullId + os.data.BaseDescriptor.ID_DELIMITER;
    if (!conf['id'].startsWith(prefix)) {
      conf['id'] = prefix + conf['id'];
    }
  }
};


/**
 * @param {Object|Array} conf
 */
plugin.config.Provider.prototype.addIcons = function(conf) {
  if (Array.isArray(conf)) {
    conf.forEach(this.addIcons, this);
  } else if (!conf['icons']) {
    var icons = '';

    var layerType = conf['layerType'];
    if (layerType === os.layer.LayerType.TILES || layerType === os.layer.LayerType.GROUPS) {
      icons += os.ui.Icons.TILES;
    }
    if (layerType === os.layer.LayerType.FEATURES || layerType === os.layer.LayerType.GROUPS) {
      icons += os.ui.Icons.FEATURES;
    }

    if (conf['animate']) {
      icons += os.ui.Icons.TIME;
    }

    conf['icons'] = icons;
  }
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

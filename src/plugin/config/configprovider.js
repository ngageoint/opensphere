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
      try {
        var conf = this.layers_[id];
        var fullId = this.getId() + os.data.BaseDescriptor.ID_DELIMITER + id;
        var descriptor = os.dataManager.getDescriptor(fullId);

        if (!descriptor) {
          descriptor = new os.data.ConfigDescriptor();
        }

        this.fixId(fullId, conf);
        this.addIcons(conf);

        descriptor.setBaseConfig(conf);
        os.dataManager.addDescriptor(descriptor);
        this.addDescriptor(descriptor, false, false);
      } catch (e) {
        goog.log.error(this.log, 'There was an error processing the configuration', e);
      }
    }
  }

  this.dispatchEvent(new os.data.DataProviderEvent(os.data.DataProviderEventType.LOADED, this));
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
    conf['id'] = fullId + os.data.BaseDescriptor.ID_DELIMITER + conf['id'];
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

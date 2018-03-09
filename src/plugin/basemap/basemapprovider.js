goog.provide('plugin.basemap.BaseMapProvider');

goog.require('os.data.BaseDescriptor');
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
plugin.basemap.BaseMapProvider = function() {
  plugin.basemap.BaseMapProvider.base(this, 'constructor');

  this.setId(plugin.basemap.ID);

  /**
   * @type {Object<string, Array<string>>}
   * @private
   */
  this.defaultSets_ = null;

  /**
   * @type {Array.<string>}
   * @private
   */
  this.defaults_ = null;

  /**
   * @type {Object<string, Array<!string>>}
   * @private
   */
  this.failSets_ = {};

  // this provider should not show up in the server manager
  this.listInServers = false;

  os.proj.switch.SwitchProjection.getInstance().listen(
      os.proj.switch.BinnedLayersEvent.TYPE, this.onSwitchProjectionBins, false, this);

  os.dispatcher.listen(os.MapEvent.TERRAIN_DISABLED, this.onTerrainDisabled, false, this);
  os.dispatcher.listen('basemapAddFailover', this.activateFailSet, false, this);
};
goog.inherits(plugin.basemap.BaseMapProvider, os.ui.data.DescriptorProvider);


/**
 * @inheritDoc
 */
plugin.basemap.BaseMapProvider.prototype.disposeInternal = function() {
  plugin.basemap.BaseMapProvider.base(this, 'disposeInternal');
  os.dispatcher.unlisten(os.MapEvent.TERRAIN_DISABLED, this.onTerrainDisabled, false, this);
  os.dispatcher.unlisten('basemapAddFailover', this.activateFailSet, false, this);
};


/**
 * @inheritDoc
 */
plugin.basemap.BaseMapProvider.prototype.configure = function(config) {
  this.setLabel(plugin.basemap.LAYER_TYPE);
  this.defaultSets_ = /** @type {Object<string, Array<string>>} */ (config['defaults']);

  if (this.defaultSets_) {
    this.defaults_ = this.defaultSets_[os.map.PROJECTION.getCode()];
  }

  var failSets = /** @type {Object<string, Array<!string>>} */ (config['failSet']);

  if (failSets) {
    this.failSets_ = failSets;
  }

  this.addBaseMapFromConfig(config);
};


/**
 * @inheritDoc
 */
plugin.basemap.BaseMapProvider.prototype.load = function(ping) {
  this.dispatchEvent(new os.data.DataProviderEvent(os.data.DataProviderEventType.LOADING, this));

  var anyActive = false;
  if (!this.getChildren()) {
    var list = this.getDescriptors();

    for (var i = 0, n = list.length; i < n; i++) {
      var descriptor = list[i];
      this.addDescriptor(descriptor, false, false);

      if (descriptor.getDescriptorType() == plugin.basemap.ID && descriptor.isActive()) {
        anyActive = true;
      }
    }
  }

  var d;
  if (!anyActive && os.dataManager && this.defaults_ && this.defaults_.length > 0) {
    for (i = 0, n = this.defaults_.length; i < n; i++) {
      d = os.dataManager.getDescriptor(this.getId() + os.data.BaseDescriptor.ID_DELIMITER + this.defaults_[i]);

      if (d) {
        d.setActive(true);
      }
    }
  }

  this.dispatchEvent(new os.data.DataProviderEvent(os.data.DataProviderEventType.LOADED, this));
};


/**
 * Activates the fail set for the given projection, if any
 * @protected
 */
plugin.basemap.BaseMapProvider.prototype.activateFailSet = function() {
  var list = this.failSets_[os.map.PROJECTION.getCode()];

  if (list) {
    var dm = os.dataManager;
    var prefix = this.getId() + os.data.BaseDescriptor.ID_DELIMITER;

    for (var i = 0, n = list.length; i < n; i++) {
      var d = dm.getDescriptor(prefix + list[i]);

      if (d) {
        d.setActive(true);
      }
    }
  }
};


/**
 * @param {Object.<string, *>} config The config object
 */
plugin.basemap.BaseMapProvider.prototype.addBaseMapFromConfig = function(config) {
  var dm = os.dataManager;
  /**
   * @type {Array.<string>}
   */
  var sets = ['maps', 'userMaps'];
  for (var s = 0, ss = sets.length; s < ss; s++) {
    var set = config[sets[s]];

    for (var id in set) {
      var conf = set[id];

      if (conf) {
        var type = conf['type'] ? conf['type'].toLowerCase() : null;
        if (type == plugin.basemap.TERRAIN_TYPE) {
          //
          // TODO: terrain config is still set in base maps because we're adding a descriptor to inform the user that
          //       the controls for it have moved. after a release cycle, remove the descriptor and update configs to
          //       use the new key (os.config.DisplaySetting.TERRAIN_OPTIONS).
          //

          // if multiple terrain descriptors are configured, the last one will win
          var terrainOptions = /** @type {osx.map.TerrainProviderOptions|undefined} */ (conf['options']);
          if (terrainOptions && terrainOptions.url) {
            var terrainType = /** @type {string|undefined} */ (conf['baseType']);
            if (terrainType) {
              terrainOptions.type = terrainType;
              os.settings.set(os.config.DisplaySetting.TERRAIN_OPTIONS, terrainOptions);
            }
          }

          // create a descriptor that will inform the user on where terrain was moved to
          var terrainId = this.getTerrainId();
          var d = dm.getDescriptor(terrainId);
          if (!d) {
            d = new plugin.basemap.TerrainDescriptor();
            d.setId(terrainId);
            dm.addDescriptor(d);
          }
        } else if (type == plugin.basemap.TYPE) {
          var mapId = this.getId() + os.data.BaseDescriptor.ID_DELIMITER + id;
          var d = dm.getDescriptor(mapId);

          if (!d) {
            d = new plugin.basemap.BaseMapDescriptor();
            d.setId(mapId);
            d.setProvider(this.getLabel());
            dm.addDescriptor(d);
          }

          d.setConfig(conf);
          d.setCanDelete(s > 0);
          d.setTitle(conf['title']);
          d.setDescription(conf['description']);
          d.setDeleteTime(NaN);
          d.updateActiveFromTemp();
        }
      }
    }
  }
};


/**
 * See if there are any base maps left after the projection switch. If not, add the default set of base maps
 * for the new projection.
 *
 * @param {os.proj.switch.BinnedLayersEvent} evt
 * @protected
 */
plugin.basemap.BaseMapProvider.prototype.onSwitchProjectionBins = function(evt) {
  var layers = os.MapContainer.getInstance().getLayers();
  var bins = evt.layers;
  var numBaseMaps = 0;
  var map = {};

  for (var i = 0, n = bins.remove.length; i < n; i++) {
    map[bins.remove[i]['id']] = true;
  }

  for (i = 0, n = bins.add.length; i < n; i++) {
    if (bins.add[i]['type'].toLowerCase() === plugin.basemap.TYPE) {
      numBaseMaps++;
    }
  }

  for (i = 0, n = layers.length; i < n; i++) {
    var ilayer = /** @type {os.layer.ILayer} */ (layers[i]);

    if (!(ilayer.getId() in map) && ilayer instanceof plugin.basemap.layer.BaseMap) {
      numBaseMaps++;
    }
  }

  if (!numBaseMaps) {
    var p = /** @type {os.proj.switch.SwitchProjection} */ (evt.target).getNewProjection();

    if (p) {
      var defaults = this.defaultSets_[p.getCode()];
      if (defaults) {
        var dm = os.dataManager;

        for (i = 0, n = defaults.length; i < n; i++) {
          var d = dm.getDescriptor(this.getId() + os.data.BaseDescriptor.ID_DELIMITER + defaults[i]);

          if (d) {
            bins.add.push(d.getLayerOptions());
          }
        }
      }
    }
  }
};


/**
 * Get the id to use for the terrain descriptor.
 * @return {string}
 * @protected
 */
plugin.basemap.BaseMapProvider.prototype.getTerrainId = function() {
  return this.getId() + os.data.BaseDescriptor.ID_DELIMITER + 'terrain';
};


/**
 * Handle terrain disabled event from the map container.
 * @param {goog.events.Event} event The event.
 * @protected
 *
 * @todo Remove when the descriptor is no longer used.
 */
plugin.basemap.BaseMapProvider.prototype.onTerrainDisabled = function(event) {
  var descriptor = os.dataManager.getDescriptor(this.getTerrainId());
  if (descriptor) {
    // remove the descriptor from the data manager
    os.dataManager.removeDescriptor(descriptor);
    this.removeDescriptor(descriptor);
    goog.dispose(descriptor);
  }
};

goog.module('plugin.basemap.BaseMapProvider');
goog.module.declareLegacyNamespace();

const dispose = goog.require('goog.dispose');
const dispatcher = goog.require('os.Dispatcher');
const MapContainer = goog.require('os.MapContainer');
const MapEvent = goog.require('os.MapEvent');
const BaseDescriptor = goog.require('os.data.BaseDescriptor');
const DataManager = goog.require('os.data.DataManager');
const DataProviderEvent = goog.require('os.data.DataProviderEvent');
const DataProviderEventType = goog.require('os.data.DataProviderEventType');
const IDataProvider = goog.require('os.data.IDataProvider');
const osImplements = goog.require('os.implements');
const osMap = goog.require('os.map');
const osProjSwitch = goog.require('os.proj.switch');
const DescriptorProvider = goog.require('os.ui.data.DescriptorProvider');
const basemap = goog.require('plugin.basemap');
const BaseMapDescriptor = goog.require('plugin.basemap.BaseMapDescriptor');
const TerrainDescriptor = goog.require('plugin.basemap.TerrainDescriptor');
const BaseMap = goog.require('plugin.basemap.layer.BaseMap');


/**
 * The base map provider provides access to pre-configured map layers
 *
 * @implements {IDataProvider}
 * @see {@link basemap.BaseMapPlugin} for configuration instructions
 */
class BaseMapProvider extends DescriptorProvider {
  /**
   * Constructor.
   */
  constructor() {
    super();

    this.setId(basemap.ID);

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

    osProjSwitch.SwitchProjection.getInstance().listen(
        osProjSwitch.BinnedLayersEvent.TYPE, this.onSwitchProjectionBins, false, this);

    dispatcher.getInstance().listen(MapEvent.TERRAIN_DISABLED, this.onTerrainDisabled, false, this);
    dispatcher.getInstance().listen('basemapAddFailover', this.activateFailSet, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    dispatcher.getInstance().unlisten(MapEvent.TERRAIN_DISABLED, this.onTerrainDisabled, false, this);
    dispatcher.getInstance().unlisten('basemapAddFailover', this.activateFailSet, false, this);
  }

  /**
   * @inheritDoc
   */
  configure(config) {
    this.setLabel(basemap.LAYER_TYPE);
    this.defaultSets_ = /** @type {Object<string, Array<string>>} */ (config['defaults']);

    if (this.defaultSets_) {
      this.defaults_ = this.defaultSets_[osMap.PROJECTION.getCode()];
    }

    var failSets = /** @type {Object<string, Array<!string>>} */ (config['failSet']);

    if (failSets) {
      this.failSets_ = failSets;
    }

    this.addBaseMapFromConfig(config);
  }

  /**
   * @inheritDoc
   */
  load(ping) {
    this.dispatchEvent(new DataProviderEvent(DataProviderEventType.LOADING, this));

    var anyActive = false;
    if (!this.getChildren()) {
      var list = this.getDescriptors();

      for (var i = 0, n = list.length; i < n; i++) {
        var descriptor = list[i];
        this.addDescriptor(descriptor, false, false);

        if (descriptor.getDescriptorType() == basemap.ID && descriptor.isActive()) {
          anyActive = true;
        }
      }
    }

    var d;
    if (!anyActive && DataManager.getInstance() && this.defaults_ && this.defaults_.length > 0) {
      for (i = 0, n = this.defaults_.length; i < n; i++) {
        d = DataManager.getInstance().getDescriptor(this.getId() + BaseDescriptor.ID_DELIMITER + this.defaults_[i]);

        if (d) {
          d.setActive(true);
        }
      }
    }

    this.dispatchEvent(new DataProviderEvent(DataProviderEventType.LOADED, this));
  }

  /**
   * Activates the fail set for the given projection, if any
   *
   * @protected
   */
  activateFailSet() {
    var list = this.failSets_[osMap.PROJECTION.getCode()];

    if (list) {
      var dm = DataManager.getInstance();
      var prefix = this.getId() + BaseDescriptor.ID_DELIMITER;

      for (var i = 0, n = list.length; i < n; i++) {
        var d = dm.getDescriptor(prefix + list[i]);

        if (d) {
          d.setActive(true);
        }
      }
    }
  }

  /**
   * @param {Object.<string, *>} config The config object
   */
  addBaseMapFromConfig(config) {
    var dm = DataManager.getInstance();
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
          if (type == basemap.TERRAIN_TYPE) {
            var terrainOptions = /** @type {osx.map.TerrainProviderOptions|undefined} */ (conf['options']);
            var terrainType = /** @type {string|undefined} */ (conf['baseType']);
            if (terrainOptions && terrainType) {
              terrainOptions.id = id;
              terrainOptions.title = conf['title'] || '';
              terrainOptions.type = terrainType;

              osMap.terrain.addTerrainProvider(terrainOptions);
            }
          } else if (type == basemap.TYPE) {
            var mapId = this.getId() + BaseDescriptor.ID_DELIMITER + id;
            var d = dm.getDescriptor(mapId);

            if (!d) {
              d = new BaseMapDescriptor();
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

    if (osMap.terrain.hasTerrain()) {
      // if at least one terrain provider has been loaded, add a descriptor to enable/disable terrain
      var terrainId = this.getTerrainId();
      var d = dm.getDescriptor(terrainId);
      if (!d) {
        d = new TerrainDescriptor();
        d.setId(terrainId);
        dm.addDescriptor(d);
      }
    }
  }

  /**
   * See if there are any base maps left after the projection switch. If not, add the default set of base maps
   * for the new projection.
   *
   * @param {osProjSwitch.BinnedLayersEvent} evt
   * @protected
   */
  onSwitchProjectionBins(evt) {
    var layers = MapContainer.getInstance().getLayers();
    var bins = evt.layers;
    var numBaseMaps = 0;
    var map = {};

    for (var i = 0, n = bins.remove.length; i < n; i++) {
      map[bins.remove[i]['id']] = true;
    }

    for (i = 0, n = bins.add.length; i < n; i++) {
      if (bins.add[i]['type'].toLowerCase() === basemap.TYPE) {
        numBaseMaps++;
      }
    }

    for (i = 0, n = layers.length; i < n; i++) {
      var ilayer = /** @type {os.layer.ILayer} */ (layers[i]);

      if (!(ilayer.getId() in map) && ilayer instanceof BaseMap) {
        numBaseMaps++;
      }
    }

    if (!numBaseMaps) {
      var p = /** @type {osProjSwitch.SwitchProjection} */ (evt.target).getNewProjection();

      if (p) {
        var defaults = this.defaultSets_[p.getCode()];
        if (defaults) {
          var dm = DataManager.getInstance();

          for (i = 0, n = defaults.length; i < n; i++) {
            var d = dm.getDescriptor(this.getId() + BaseDescriptor.ID_DELIMITER + defaults[i]);

            if (d) {
              bins.add.push(d.getLayerOptions());
            }
          }
        }
      }
    }
  }

  /**
   * Get the id to use for the terrain descriptor.
   *
   * @return {string}
   * @protected
   */
  getTerrainId() {
    return this.getId() + BaseDescriptor.ID_DELIMITER + 'terrain';
  }

  /**
   * Handle terrain disabled event from the map container.
   *
   * @param {goog.events.Event} event The event.
   * @protected
   */
  onTerrainDisabled(event) {
    var descriptor = DataManager.getInstance().getDescriptor(this.getTerrainId());
    if (descriptor) {
      // remove the descriptor from the data manager
      DataManager.getInstance().removeDescriptor(descriptor);
      this.removeDescriptor(descriptor);
      dispose(descriptor);
    }
  }

  /**
   * @inheritDoc
   */
  getErrorMessage() {
    return null;
  }
}
osImplements(BaseMapProvider, IDataProvider.ID);

exports = BaseMapProvider;

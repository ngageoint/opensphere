goog.provide('plugin.basemap.BaseMapPlugin');

goog.require('os.MapContainer');
goog.require('os.data.DataManager');
goog.require('os.data.ProviderEntry');
goog.require('os.layer.Group');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.state.StateManager');
goog.require('plugin.basemap');
goog.require('plugin.basemap.BaseMapConfig');
goog.require('plugin.basemap.BaseMapDescriptor');
goog.require('plugin.basemap.BaseMapProvider');
goog.require('plugin.basemap.Group');
goog.require('plugin.basemap.TerrainDescriptor');
goog.require('plugin.basemap.v3.BaseMapState');
goog.require('plugin.basemap.v4.BaseMapState');



/**
 * <p>Base maps (a.k.a. map layers) comprise the background imagery for the map.</p>
 *
 * <p>
 * Map layers are configured under <code>admin.providers.basemap.maps</code> in settings. The default set of
 * map layers is defined at <code>admin.providers.basemap.defaults</code>.
 * </p>
 *
 * <p>
 * To configure the individual maps, see the docs for:
 * <ul>
 * <li>Arc Layers: {@link plugin.xyz.XYZLayerConfig Use XYZ}
 * <li>{@link plugin.basemap.BaseMapConfig General base map config}
 * <li>{@link plugin.ogc.wms.WMSLayerConfig WMS layers}
 * <li>{@link plugin.xyz.XYZLayerConfig XYZ layers}
 * </ul>
 * </p>
 *
 * @example <caption>Basemap Provider config</caption>
 *  {
 *    "admin": {
 *      "providers": {
 *        "basemap": {
 *          "defaults": {
 *            "EPSG:4326": ["maplayer1", "maplayer2"]
 *          },
 *          "maps": {
 *            "maplayer1": {...},
 *            "maplayer2": {...}
 *          }
 *        }
 *      }
 *    }
 *  }
 *
 * @see {@link plugin.basemap.BaseMapConfig} for general base map configuration
 * @see {@link plugin.ogc.wms.WMSLayerConfig} for configuring WMS map layers
 * @see {@link plugin.xyz.XYZLayerConfig} for configuring XYZ map layers (also best for ArcGIS map layers)
 *
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.basemap.BaseMapPlugin = function() {
  plugin.basemap.BaseMapPlugin.base(this, 'constructor');
  this.id = plugin.basemap.ID;
};
goog.inherits(plugin.basemap.BaseMapPlugin, os.plugin.AbstractPlugin);


/**
 * @inheritDoc
 */
plugin.basemap.BaseMapPlugin.prototype.init = function() {
  var dm = os.dataManager;

  // register the base map provider type
  dm.registerProviderType(new os.data.ProviderEntry(
      this.id,
      plugin.basemap.BaseMapProvider,
      plugin.basemap.LAYER_TYPE,
      'Map layers provide background imagery. They often include streets, borders, or other reference information.',
      ''));

  // register the base map descriptor types
  dm.registerDescriptorType(this.id, plugin.basemap.BaseMapDescriptor);
  dm.registerDescriptorType(plugin.basemap.TERRAIN_ID, plugin.basemap.TerrainDescriptor);

  // add the base map group
  os.MapContainer.getInstance().addGroup(new plugin.basemap.Group());

  // register the layer config
  os.layer.config.LayerConfigManager.getInstance().registerLayerConfig(
      plugin.basemap.TYPE, plugin.basemap.BaseMapConfig);

  // register the state
  var sm = os.state.StateManager.getInstance();
  sm.addStateImplementation(os.state.Versions.V3, plugin.basemap.v3.BaseMapState);
  sm.addStateImplementation(os.state.Versions.V4, plugin.basemap.v4.BaseMapState);
};

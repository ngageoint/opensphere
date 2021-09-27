goog.declareModuleId('plugin.basemap.BaseMapPlugin');

import {Controller as LayersCtrl} from '../../os/ui/layers.js';
import {ID, LAYER_TYPE, TERRAIN_ID, TYPE, isBaseMap} from './basemap.js';
import BaseMapConfig from './basemapconfig.js';
import BaseMapDescriptor from './basemapdescriptor.js';
import Group from './basemapgroup.js';
import BaseMapProvider from './basemapprovider.js';
import TerrainDescriptor from './terraindescriptor.js';
import pluginBasemapV3BaseMapState from './v3/basemapstate.js';
import BaseMapState from './v4/basemapstate.js';

const MapContainer = goog.require('os.MapContainer');
const DataManager = goog.require('os.data.DataManager');
const ProviderEntry = goog.require('os.data.ProviderEntry');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const StateManager = goog.require('os.state.StateManager');
const Versions = goog.require('os.state.Versions');


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
 * <li>{@link BaseMapConfig General base map config}
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
 * @see {@link basemap.BaseMapConfig} for general base map configuration
 * @see {@link plugin.ogc.wms.WMSLayerConfig} for configuring WMS map layers
 * @see {@link plugin.xyz.XYZLayerConfig} for configuring XYZ map layers (also best for ArcGIS map layers)
 */
export default class BaseMapPlugin extends AbstractPlugin {
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
    var dm = DataManager.getInstance();

    // register the base map provider type
    dm.registerProviderType(new ProviderEntry(
        this.id,
        BaseMapProvider,
        LAYER_TYPE,
        'Map layers provide background imagery. They often include streets, borders, or other reference information.'));

    // register the base map descriptor types
    dm.registerDescriptorType(this.id, BaseMapDescriptor);
    dm.registerDescriptorType(TERRAIN_ID, TerrainDescriptor);

    // add the base map group
    MapContainer.getInstance().addGroup(new Group());

    // register the layer config
    LayerConfigManager.getInstance().registerLayerConfig(TYPE, BaseMapConfig);

    // register the state
    var sm = StateManager.getInstance();
    sm.addStateImplementation(Versions.V3, pluginBasemapV3BaseMapState);
    sm.addStateImplementation(Versions.V4, BaseMapState);

    // do not toggle the base maps on and off
    LayersCtrl.SKIP_TOGGLE_FUNCS.push(isBaseMap);
  }
}

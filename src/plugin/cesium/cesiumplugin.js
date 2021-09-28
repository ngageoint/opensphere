goog.declareModuleId('plugin.cesium.Plugin');

import {CESIUM_ONLY_LAYER, DEFAULT_ION_URL, ID, SettingsKey, setIonUrl} from './cesium.js';
import CesiumRenderer from './cesiumrenderer.js';
import {ID as TILE_ID, TYPE as TILE_TYPE} from './tiles/cesium3dtiles.js';
import Descriptor from './tiles/cesium3dtilesdescriptor.js';
import TilesetImportUI from './tiles/cesium3dtilesimportui.js';
import LayerConfig from './tiles/cesium3dtileslayerconfig.js';
import Provider from './tiles/cesium3dtilesprovider.js';
import {TYPE as MIME_TYPE} from './tiles/mime.js';

const MapContainer = goog.require('os.MapContainer');
const settings = goog.require('os.config.Settings');
const DataManager = goog.require('os.data.DataManager');
const ProviderEntry = goog.require('os.data.ProviderEntry');
const osImplements = goog.require('os.implements');
const Group = goog.require('os.layer.Group');
const ILayer = goog.require('os.layer.ILayer');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const ImportManager = goog.require('os.ui.im.ImportManager');
const AbstractWebGLRenderer = goog.require('os.webgl.AbstractWebGLRenderer');

/**
 * Provides a WebGL renderer for the map, powered by Cesium.
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
    // update the Ion service URL from settings. this should be done first, as it impacts if Ion-related features are
    // loaded in the application.
    const ionUrl = /** @type {string} */ (settings.getInstance().get(SettingsKey.ION_URL, DEFAULT_ION_URL));
    setIonUrl(ionUrl);

    // check if cesium is the active renderer
    var mapContainer = MapContainer.getInstance();
    if (settings.getInstance().get(AbstractWebGLRenderer.ACTIVE_SETTINGS_KEY) == ID) {
      this.registerCesiumTypes_();
      mapContainer.setWebGLRenderer(new CesiumRenderer());
    } else {
      mapContainer.addWebGLRenderer(new CesiumRenderer());
    }
  }

  /**
   * Register OpenSphere data types used by Cesium.
   * @private
   */
  registerCesiumTypes_() {
    var mapContainer = MapContainer.getInstance();

    // register 3D tiles layers
    var lcm = LayerConfigManager.getInstance();
    lcm.registerLayerConfig(TILE_ID, LayerConfig);

    var dm = DataManager.getInstance();
    dm.registerProviderType(new ProviderEntry(
        TILE_ID,
        Provider,
        TILE_TYPE,
        TILE_TYPE));
    dm.registerDescriptorType(TILE_ID, Descriptor);

    // add 3D layer group
    var group = new Group();
    group.setPriority(3);
    group.setOSType(CESIUM_ONLY_LAYER);
    group.setCheckFunc(function(layer) {
      if (osImplements(layer, ILayer.ID)) {
        return /** @type {ILayer} */ (layer).getOSType() === CESIUM_ONLY_LAYER;
      }
      return false;
    });

    mapContainer.addGroup(group);

    var im = ImportManager.getInstance();
    im.registerImportDetails(TILE_TYPE, true);
    im.registerImportUI(MIME_TYPE, new TilesetImportUI());
  }
}

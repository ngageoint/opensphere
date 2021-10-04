goog.declareModuleId('plugin.cesium.Plugin');

import settings from '../../os/config/settings.js';
import DataManager from '../../os/data/datamanager.js';
import ProviderEntry from '../../os/data/providerentry.js';
import osImplements from '../../os/implements.js';
import LayerConfigManager from '../../os/layer/config/layerconfigmanager.js';
import Group from '../../os/layer/group.js';
import ILayer from '../../os/layer/ilayer.js';
import MapContainer from '../../os/mapcontainer.js';
import AbstractPlugin from '../../os/plugin/abstractplugin.js';
import ImportManager from '../../os/ui/im/importmanager.js';
import AbstractWebGLRenderer from '../../os/webgl/abstractwebglrenderer.js';
import {CESIUM_ONLY_LAYER, DEFAULT_ION_URL, ID, SettingsKey, setIonUrl} from './cesium.js';
import CesiumRenderer from './cesiumrenderer.js';
import {ID as TILE_ID, TYPE as TILE_TYPE} from './tiles/cesium3dtiles.js';
import Descriptor from './tiles/cesium3dtilesdescriptor.js';
import TilesetImportUI from './tiles/cesium3dtilesimportui.js';
import LayerConfig from './tiles/cesium3dtileslayerconfig.js';
import Provider from './tiles/cesium3dtilesprovider.js';
import {TYPE as MIME_TYPE} from './tiles/mime.js';


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

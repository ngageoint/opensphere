goog.module('plugin.cesium.Plugin');
goog.module.declareLegacyNamespace();

const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const MapContainer = goog.require('os.MapContainer');
const settings = goog.require('os.config.Settings');
const ProviderEntry = goog.require('os.data.ProviderEntry');
const Group = goog.require('os.layer.Group');
const ILayer = goog.require('os.layer.ILayer');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const ImportManager = goog.require('os.ui.im.ImportManager');
const cesium = goog.require('plugin.cesium');
const CesiumRenderer = goog.require('plugin.cesium.CesiumRenderer');
const tiles = goog.require('plugin.cesium.tiles');
const Descriptor = goog.require('plugin.cesium.tiles.Descriptor');
const LayerConfig = goog.require('plugin.cesium.tiles.LayerConfig');
const Provider = goog.require('plugin.cesium.tiles.Provider');
const TilesetImportUI = goog.require('plugin.cesium.tiles.TilesetImportUI');
const mime = goog.require('plugin.cesium.tiles.mime');


/**
 * Provides a WebGL renderer for the map, powered by Cesium.
 */
class Plugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = Plugin.ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    // update the Ion service URL from settings. this should be done first, as it impacts if Ion-related features are
    // loaded in the application.
    const ionUrl = /** @type {string} */ (settings.getInstance().get(cesium.SettingsKey.ION_URL,
        cesium.DEFAULT_ION_URL));
    cesium.setIonUrl(ionUrl);

    // check if cesium is the active renderer
    var mapContainer = MapContainer.getInstance();
    if (settings.getInstance().get(os.webgl.AbstractWebGLRenderer.ACTIVE_SETTINGS_KEY) == Plugin.ID) {
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
    lcm.registerLayerConfig(tiles.ID, LayerConfig);

    var dm = os.dataManager;
    dm.registerProviderType(new ProviderEntry(
        tiles.ID,
        Provider,
        tiles.TYPE,
        tiles.TYPE));
    dm.registerDescriptorType(tiles.ID, Descriptor);

    // add 3D layer group
    var group = new Group();
    group.setPriority(3);
    group.setOSType(cesium.CESIUM_ONLY_LAYER);
    group.setCheckFunc(function(layer) {
      if (os.implements(layer, ILayer.ID)) {
        return (
          /** @type {ILayer} */
          (layer).getOSType() === cesium.CESIUM_ONLY_LAYER
        );
      }
      return false;
    });

    mapContainer.addGroup(group);

    var im = ImportManager.getInstance();
    im.registerImportDetails(tiles.TYPE, true);
    im.registerImportUI(mime.TYPE, new TilesetImportUI());
  }
}


/**
 * The plugin identifier.
 * @type {string}
 * @const
 */
Plugin.ID = 'cesium';


exports = Plugin;

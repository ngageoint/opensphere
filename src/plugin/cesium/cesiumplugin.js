goog.provide('plugin.cesium.Plugin');

goog.require('os.data.ProviderEntry');
goog.require('os.layer.Group');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.webgl.SynchronizerManager');
goog.require('plugin.cesium.CesiumRenderer');
goog.require('plugin.cesium.menu');
goog.require('plugin.cesium.mixin.olcs');
goog.require('plugin.cesium.mixin.renderloop');
goog.require('plugin.cesium.sync.ImageSynchronizer');
goog.require('plugin.cesium.sync.TileSynchronizer');
goog.require('plugin.cesium.sync.VectorSynchronizer');
goog.require('plugin.cesium.tiles');
goog.require('plugin.cesium.tiles.Descriptor');
goog.require('plugin.cesium.tiles.LayerConfig');
goog.require('plugin.cesium.tiles.Provider');
goog.require('plugin.cesium.tiles.TilesetImportUI');
goog.require('plugin.cesium.tiles.mime');


/**
 * Provides a WebGL renderer for the map, powered by Cesium.
 *
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.cesium.Plugin = function() {
  plugin.cesium.Plugin.base(this, 'constructor');
  this.id = plugin.cesium.Plugin.ID;
};
goog.inherits(plugin.cesium.Plugin, os.plugin.AbstractPlugin);


/**
 * The plugin identifier.
 * @type {string}
 * @const
 */
plugin.cesium.Plugin.ID = 'cesium';


/**
 * @typedef {{
 *   id: number,
 *   csPattern: (number|undefined)
 * }}
 */
plugin.cesium.styleLineDashOption;


/**
 * Line dash configurations for Cesium
 * Patterns based on 16 bit number to make it look consistent between map engines
 * @type {!Array<!plugin.cesium.styleLineDashOption>}
 * @const
 */
plugin.cesium.LINE_STYLE_OPTIONS = [
  {
    id: 0,
    csPattern: undefined // []
  }, {
    id: 1,
    csPattern: parseInt('1111111111110000', 2) // [12, 4]
  }, {
    id: 2,
    csPattern: parseInt('1111111100000000', 2) // [8, 8]
  }, {
    id: 3,
    csPattern: parseInt('1111100011111000', 2) // [4, 4, 4, 4]
  }, {
    id: 4,
    csPattern: parseInt('1111100000000000', 2) // [4, 12]
  }, {
    id: 5,
    csPattern: parseInt('1110000011100000', 2) // [2, 6, 2, 6]
  }, {
    id: 6,
    csPattern: parseInt('1111110000111000', 2) // [5, 5, 1, 5]
  }, {
    id: 7,
    csPattern: parseInt('1111111110011100', 2) // [7, 4, 1, 4]
  }
];


/**
 * @inheritDoc
 */
plugin.cesium.Plugin.prototype.init = function() {
  // update the Ion service URL from settings. this should be done first, as it impacts if Ion-related features are
  // loaded in the application.
  plugin.cesium.ionUrl = /** @type {string} */ (os.settings.get(plugin.cesium.SettingsKey.ION_URL,
      plugin.cesium.DEFAULT_ION_URL));

  // set the WebGL renderer to use Cesium
  os.MapContainer.getInstance().setWebGLRenderer(new plugin.cesium.CesiumRenderer());

  // register the default set of synchronizers
  var sm = os.webgl.SynchronizerManager.getInstance();
  sm.registerSynchronizer(os.layer.SynchronizerType.VECTOR, plugin.cesium.sync.VectorSynchronizer);
  sm.registerSynchronizer(os.layer.SynchronizerType.TILE, plugin.cesium.sync.TileSynchronizer);
  sm.registerSynchronizer(os.layer.SynchronizerType.IMAGE, plugin.cesium.sync.ImageSynchronizer);
  sm.registerSynchronizer(os.layer.SynchronizerType.DRAW, plugin.cesium.sync.VectorSynchronizer);

  // add 3D layer group
  var group = new os.layer.Group();
  group.setPriority(3);
  group.setOSType(plugin.cesium.CESIUM_ONLY_LAYER);
  group.setCheckFunc(function(layer) {
    if (os.implements(layer, os.layer.ILayer.ID)) {
      return /** @type {os.layer.ILayer} */ (layer).getOSType() === plugin.cesium.CESIUM_ONLY_LAYER;
    }
    return false;
  });

  os.map.mapContainer.addGroup(group);

  // set up menus
  plugin.cesium.menu.importSetup();

  // register 3D tiles layers
  var lcm = os.layer.config.LayerConfigManager.getInstance();
  lcm.registerLayerConfig(plugin.cesium.tiles.ID, plugin.cesium.tiles.LayerConfig);

  var dm = os.dataManager;
  dm.registerProviderType(new os.data.ProviderEntry(
      plugin.cesium.tiles.ID,
      plugin.cesium.tiles.Provider,
      plugin.cesium.tiles.TYPE,
      plugin.cesium.tiles.TYPE));
  dm.registerDescriptorType(plugin.cesium.tiles.ID, plugin.cesium.tiles.Descriptor);

  var im = os.ui.im.ImportManager.getInstance();
  im.registerImportDetails(plugin.cesium.tiles.TYPE, true);
  im.registerImportUI(plugin.cesium.tiles.mime.TYPE, new plugin.cesium.tiles.TilesetImportUI());
};

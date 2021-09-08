goog.module('plugin.vectortile.VectorTilePlugin');

const MapContainer = goog.require('os.MapContainer');
const OLDoubleClick = goog.require('os.interaction.DoubleClick');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const {ID} = goog.require('plugin.vectortile');
const DoubleClick = goog.require('plugin.vectortile.DoubleClick');
const VectorTileLayerConfig = goog.require('plugin.vectortile.VectorTileLayerConfig');


/**
 * Plugin to add vector tile support to OpenSphere.
 */
class VectorTilePlugin extends AbstractPlugin {
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
    // TODO: Add provider/descriptor? Currently only configurable with config descriptors.
    // TODO: Add import UI so users can add vector tile layers.

    const lcm = LayerConfigManager.getInstance();
    lcm.registerLayerConfig(ID, VectorTileLayerConfig);

    const map = MapContainer.getInstance().getMap();
    const interactions = map.getInteractions();

    // find the feature double click interaction
    const arr = interactions.getArray();
    let i = arr.length;
    while (i--) {
      if (arr[i] instanceof OLDoubleClick) {
        break;
      }
    }

    // ... and add ours just before it
    if (i > -1) {
      interactions.insertAt(i, new DoubleClick());
    }
  }

  /**
   * Get the global instance.
   * @return {!VectorTilePlugin}
   */
  static getInstance() {
    if (!instance) {
      instance = new VectorTilePlugin();
    }

    return instance;
  }
}

/**
 * Global VectorTilePlugin instance.
 * @type {VectorTilePlugin|undefined}
 */
let instance;

exports = VectorTilePlugin;

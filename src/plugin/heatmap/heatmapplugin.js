goog.module('plugin.heatmap.HeatmapPlugin');
goog.module.declareLegacyNamespace();

const DataEventType = goog.require('os.data.event.DataEventType');
const VectorSource = goog.require('os.source.Vector');

const DataManager = goog.require('os.data.DataManager');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const {ID} = goog.require('plugin.heatmap');
const HeatmapLayerConfig = goog.require('plugin.heatmap.HeatmapLayerConfig');
const heatmapMenu = goog.require('plugin.heatmap.menu');


/**
 * Adds the ability to generate a heatmap layer from any vector layer.
 */
class HeatmapPlugin extends AbstractPlugin {
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
    LayerConfigManager.getInstance().registerLayerConfig(ID, HeatmapLayerConfig);

    // setup the layer action manager
    heatmapMenu.setup();

    // listen for source add so that we can set the action as supported
    var dm = DataManager.getInstance();
    dm.listen(DataEventType.SOURCE_ADDED, function(event) {
      var source = event.source;
      if (source && source instanceof VectorSource) {
        source.setSupportsAction(heatmapMenu.EventType.GENERATE_HEATMAP, true);
      }
    });
  }

  /**
   * Get the global instance.
   * @return {!HeatmapPlugin}
   */
  static getInstance() {
    if (!instance) {
      instance = new HeatmapPlugin();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {HeatmapPlugin} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {HeatmapPlugin|undefined}
 */
let instance;

exports = HeatmapPlugin;

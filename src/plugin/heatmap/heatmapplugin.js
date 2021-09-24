goog.declareModuleId('plugin.heatmap.HeatmapPlugin');

import {ID} from './heatmap.js';
import HeatmapLayerConfig from './heatmaplayerconfig.js';
import * as heatmapMenu from './heatmapmenu.js';

const DataEventType = goog.require('os.data.event.DataEventType');
const VectorSource = goog.require('os.source.Vector');
const DataManager = goog.require('os.data.DataManager');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');

/**
 * Adds the ability to generate a heatmap layer from any vector layer.
 */
export default class HeatmapPlugin extends AbstractPlugin {
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

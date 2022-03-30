goog.declareModuleId('plugin.heatmap.HeatmapLayerConfig');

import OLVectorSource from 'ol/src/source/Vector.js';
import AbstractLayerConfig from '../../os/layer/config/abstractlayerconfig.js';
import * as heatmap from './heatmap.js';
import Heatmap from './heatmaplayer.js';

const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');


/**
 * Config for a layer containing heatmap data.
 *
 * @template T
 */
export default class HeatmapLayerConfig extends AbstractLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = logger;

    /**
     * @type {boolean}
     * @protected
     */
    this.animate = false;
  }

  /**
   * @inheritDoc
   */
  createLayer(options) {
    this.initializeConfig(options);

    var source = this.getSource(options);
    var layer = this.getLayer(source, options);
    layer.setId(/** @type {string} */ (options['id']));

    if (options['explicitType'] != null) {
      layer.setExplicitType(/** @type {string} */ (options['explicitType']));
    }

    return layer;
  }

  /**
   * @param {OLVectorSource} source The layer source.
   * @param {Object<string, *>} options
   * @return {Heatmap}
   * @protected
   */
  getLayer(source, options) {
    return new Heatmap({
      'source': source,
      'title': options['title']
    });
  }

  /**
   * @param {Object} options Layer configuration options.
   * @return {OLVectorSource}
   * @protected
   *
   * @suppress {checkTypes}
   */
  getSource(options) {
    options = options || {};

    var sourceId = /** @type {string|undefined} */ (options['sourceId']);
    options.features = heatmap.getSourceFeatures(sourceId);

    return new OLVectorSource(options);
  }
}


/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('plugin.heatmap.HeatmapLayerConfig');

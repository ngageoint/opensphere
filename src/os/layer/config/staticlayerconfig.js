goog.declareModuleId('os.layer.config.StaticLayerConfig');

import VectorSource from '../../source/vectorsource.js';
import VectorLayer from '../vector.js';
import AbstractLayerConfig from './abstractlayerconfig.js';
import {LayerConfigId} from './layerconfig.js';

const {clone} = goog.require('goog.array');
const {getLogger} = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');

/**
 * Config for a layer containing static data.
 *
 * @template T
 */
export default class StaticLayerConfig extends AbstractLayerConfig {
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

    /**
     * @type {Array<!Feature>}
     * @protected
     */
    this.data = null;
  }

  /**
   * @inheritDoc
   */
  initializeConfig(options) {
    super.initializeConfig(options);

    this.animate = options['animate'] !== undefined ? options['animate'] : false;

    if (Array.isArray(options['data'])) {
      // make sure the array was created in this context
      this.data = options['data'] = options['data'] instanceof Array ? options['data'] : clone(options['data']);
    } else {
      this.data = null;
    }
  }

  /**
   * @inheritDoc
   */
  createLayer(options) {
    this.initializeConfig(options);

    var source = this.getSource(options);
    source.setId(this.id);
    source.setTitle(this.title);
    source.setTimeEnabled(this.animate);

    var layer = this.getLayer(source, options);
    this.restore(layer, options);

    if (options['explicitType'] != null) {
      layer.setExplicitType(/** @type {string} */ (options['explicitType']));
    }

    if (this.data) {
      source.addFeatures(this.data);
    }

    return layer;
  }

  /**
   * Restores the layer from the options
   *
   * @param {VectorLayer} layer
   * @param {Object<string, *>} options
   * @protected
   */
  restore(layer, options) {
    if (options) {
      layer.restore(options);
    }
  }

  /**
   * @param {ol.source.Vector} source The layer source.
   * @param {Object<string, *>} options
   * @return {VectorLayer}
   * @protected
   */
  getLayer(source, options) {
    return new VectorLayer({
      source: source
    });
  }

  /**
   * @param {Object<string, *>} options Layer configuration options.
   * @return {VectorSource}
   * @protected
   */
  getSource(options) {
    return new VectorSource(undefined);
  }
}

/**
 * Id for this layer config
 * @type {string}
 * @const
 * @deprecated Please use os.layer.config.LayerConfigId.STATIC instead.
 */
StaticLayerConfig.ID = LayerConfigId.STATIC;

/**
 * Logger
 * @type {Logger}
 */
const logger = getLogger('os.layer.config.StaticLayerConfig');

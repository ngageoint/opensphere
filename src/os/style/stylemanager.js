goog.declareModuleId('os.style.StyleManagerES');

import * as osStyle from './style.js';
import CircleReader from './circlereader.js';
import FillReader from './fillreader.js';
import IconReader from './iconreader.js';
import ImageReader from './imagereader.js';
import ShapeReader from './shapereader.js';
import StrokeReader from './strokereader.js';
import StyleReader from './stylereader.js';
import TextReader from './textreader.js';

const {unsafeClone} = goog.require('os.object');

const {
  default: IStyleReader
} = goog.requireType('os.style.IStyleReader');


/**
 * The style manager provides hierarchical style merging from style configs
 * stored on individual features or layers. The resulting styles are then
 * cached so that they can be re-used if other style configs resolve to the
 * same values.
 *
 * In general, getOrCreateStyle() should be called with an array of [layerStyle,
 * featureStyle(, selectedStyle)]. These style configs are designed such that "fill"
 * and "stroke" will be inherited if not set.
 *
 * Example:
 * <pre>
 * // this is a typical config for a layer
 * var layer = {
 *   // for points
 *   image: {
 *     type: 'circle',
 *     radius: 3
 *     fill: {
 *       color: [0, 255, 0, 1]
 *     }
 *     // stroke is not inherited here because a local fill exists
 *   },
 *   // for lines/polygons
 *   stroke: {
 *     color: [0, 255, 0, 1],
 *     width: 2
 *   }
 * };
 *
 * // override the color for a feature
 * var feature = {
 *   // for points
 *   image: {
 *     fill: {
 *       color: [0, 255, 255, 1]
 *     }
 *   },
 *   // for lines/polygons
 *   stroke: {
 *     color: [0, 255, 255, 1]
 *   }
 * };
 *
 * feature.setStyle(os.style.StyleManager.getInstance().getOrCreateStyle([layer, feature]));
 * </pre>
 */
export default class StyleManager {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {!StyleReader}
     * @private
     */
    this.rootReader_ = new StyleReader();

    /**
     * @type {Object<string, !IStyleReader>}
     * @private
     */
    this.readers_ = {
      'circle': new CircleReader(),
      'fill': new FillReader(),
      'icon': new IconReader(),
      'image': new ImageReader(),
      'shape': new ShapeReader(),
      'stroke': new StrokeReader(),
      'text': new TextReader()
    };

    this.rootReader_.setReaders(this.readers_);

    for (var key in this.readers_) {
      this.readers_[key].setReaders(this.readers_);
    }

    /**
     * @type {Object<string, Object>}
     * @private
     */
    this.layerConfigs_ = {};
  }

  /**
   * @param {!Object<string, *>} config
   * @return {?ol.style.Style}
   */
  getOrCreateStyle(config) {
    return this.rootReader_.getOrCreateStyle(config);
  }

  /**
   * @param {!ol.style.Style} style
   * @return {Object} config
   */
  toConfig(style) {
    var config = {};
    this.rootReader_.toConfig(style, config);
    return config;
  }

  /**
   * Get a style reader by id
   *
   * @param {string} id The reader id
   * @return {IStyleReader|undefined} The reader, if registered
   */
  getReader(id) {
    return this.readers_[id];
  }

  /**
   * @param {!string} id
   * @return {Object}
   */
  createLayerConfig(id) {
    var config = /** @type {Object} */ (unsafeClone(osStyle.DEFAULT_VECTOR_CONFIG));
    this.layerConfigs_[id] = config;
    return config;
  }

  /**
   * @param {!string} id
   */
  removeLayerConfig(id) {
    if (id in this.layerConfigs_) {
      delete this.layerConfigs_[id];
    }
  }

  /**
   * @param {!string} id
   * @return {?Object} The config or null if not found
   */
  getLayerConfig(id) {
    return id in this.layerConfigs_ ? this.layerConfigs_[id] : null;
  }

  /**
   * @param {!string} id
   * @return {Object}
   */
  getOrCreateLayerConfig(id) {
    return id in this.layerConfigs_ ? this.layerConfigs_[id] : this.createLayerConfig(id);
  }

  /**
   * Get the global instance.
   * @return {!StyleManager}
   */
  static getInstance() {
    if (!instance) {
      instance = new StyleManager();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {StyleManager} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {StyleManager|undefined}
 */
let instance;

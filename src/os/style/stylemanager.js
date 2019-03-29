goog.provide('os.style.StyleManager');

goog.require('goog.object');
goog.require('os.object');
goog.require('os.style.CircleReader');
goog.require('os.style.FillReader');
goog.require('os.style.IconReader');
goog.require('os.style.ImageReader');
goog.require('os.style.ShapeReader');
goog.require('os.style.StrokeReader');
goog.require('os.style.StyleReader');
goog.require('os.style.TextReader');



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
 *
 * @constructor
 */
os.style.StyleManager = function() {
  /**
   * @type {!os.style.StyleReader}
   * @private
   */
  this.rootReader_ = new os.style.StyleReader();

  /**
   * @type {Object<string, !os.style.IStyleReader>}
   * @private
   */
  this.readers_ = {
    'circle': new os.style.CircleReader(),
    'fill': new os.style.FillReader(),
    'icon': new os.style.IconReader(),
    'image': new os.style.ImageReader(),
    'shape': new os.style.ShapeReader(),
    'stroke': new os.style.StrokeReader(),
    'text': new os.style.TextReader()
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
};
goog.addSingletonGetter(os.style.StyleManager);


/**
 * @param {Object} config
 * @return {?ol.style.Style}
 */
os.style.StyleManager.prototype.getOrCreateStyle = function(config) {
  return this.rootReader_.getOrCreateStyle(config);
};


/**
 * @param {!ol.style.Style} style
 * @return {Object} config
 */
os.style.StyleManager.prototype.toConfig = function(style) {
  var config = {};
  this.rootReader_.toConfig(style, config);
  return config;
};


/**
 * Get a style reader by id
 * @param {string} id The reader id
 * @return {os.style.IStyleReader|undefined} The reader, if registered
 */
os.style.StyleManager.prototype.getReader = function(id) {
  return this.readers_[id];
};


/**
 * @param {!string} id
 * @return {Object}
 */
os.style.StyleManager.prototype.createLayerConfig = function(id) {
  var config = /** @type {Object} */ (os.object.unsafeClone(os.style.DEFAULT_VECTOR_CONFIG));
  this.layerConfigs_[id] = config;
  return config;
};


/**
 * @param {!string} id
 */
os.style.StyleManager.prototype.removeLayerConfig = function(id) {
  if (id in this.layerConfigs_) {
    delete this.layerConfigs_[id];
  }
};


/**
 * @param {!string} id
 * @return {?Object} The config or null if not found
 */
os.style.StyleManager.prototype.getLayerConfig = function(id) {
  return id in this.layerConfigs_ ? this.layerConfigs_[id] : null;
};


/**
 * @param {!string} id
 * @return {Object}
 */
os.style.StyleManager.prototype.getOrCreateLayerConfig = function(id) {
  return id in this.layerConfigs_ ? this.layerConfigs_[id] : this.createLayerConfig(id);
};

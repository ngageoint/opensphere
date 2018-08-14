goog.provide('os.feature.DynamicFeature');
goog.provide('os.feature.DynamicPropertyChange');

goog.require('ol.Feature');


/**
 * Dynamic feature property change types.
 * @enum {string}
 */
os.feature.DynamicPropertyChange = {
  GEOMETRY: 'change:originalGeometry'
};


/**
 * A dynamic feature that changes with time.
 * @param {ol.geom.Geometry|Object<string, *>=} opt_geometryOrProperties
 *     You may pass a Geometry object directly, or an object literal
 *     containing properties.  If you pass an object literal, you may
 *     include a Geometry associated with a `geometry` key.
 * @param {function(!ol.Feature)=} opt_initFn Initialize the feature into the animating state.
 * @param {function(!ol.Feature, boolean=)=} opt_disposeFn Restore the feature to the non-animating state.
 * @param {function(!ol.Feature, number)=} opt_updateFn Update the animating state for the given timestamp.
 * @extends {ol.Feature}
 * @constructor
 */
os.feature.DynamicFeature = function(opt_geometryOrProperties, opt_initFn, opt_disposeFn, opt_updateFn) {
  os.feature.DynamicFeature.base(this, 'constructor', opt_geometryOrProperties);

  /**
   * Initialize the feature into the animating state.
   * @type {function(!ol.Feature)}
   */
  this.initFn = opt_initFn || goog.nullFunction;

  /**
   * Restore the feature to the non-animating state.
   * @type {function(!ol.Feature, boolean=)}
   */
  this.disposeFn = opt_disposeFn || goog.nullFunction;

  /**
   * Update the animating state for the given timestamp.
   * @type {function(!ol.Feature, number)}
   */
  this.updateFn = opt_updateFn || goog.nullFunction;
};
goog.inherits(os.feature.DynamicFeature, ol.Feature);


/**
 * Initialize the feature into the animating state.
 */
os.feature.DynamicFeature.prototype.initDynamic = function() {
  this.initFn(this);
};


/**
 * Restore the feature to the non-animating state.
 * @param {boolean=} opt_disposing If the feature is being disposed.
 */
os.feature.DynamicFeature.prototype.disposeDynamic = function(opt_disposing) {
  this.disposeFn(this, opt_disposing);
};


/**
 * Update the animating state for the given timestamp.
 * @param {number} timestamp The timestamp.
 */
os.feature.DynamicFeature.prototype.updateDynamic = function(timestamp) {
  this.updateFn(this, timestamp);
};


/**
 * @inheritDoc
 * @suppress {accessControls} To allow direct access to feature metadata.
 */
os.feature.DynamicFeature.prototype.clone = function() {
  var clone = new os.feature.DynamicFeature(undefined, this.initFn, this.disposeFn, this.updateFn);
  clone.setProperties(this.values_, true);
  clone.setGeometryName(this.getGeometryName());
  var geometry = this.getGeometry();
  if (geometry != null) {
    clone.setGeometry(geometry.clone());
  }
  clone.setId(this.getId());
  return clone;
};

goog.provide('os.olm.render.BaseShape');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('ol.Feature');
goog.require('ol.events');
goog.require('ol.layer.Vector');
goog.require('ol.render.EventType');
goog.require('ol.source.Vector');



/**
 * @abstract
 * @constructor
 * @extends {goog.Disposable}
 * @param {ol.style.Style|Array<ol.style.Style>} style Style.
 */
os.olm.render.BaseShape = function(style) {
  /**
   * @private
   e @type {ol.PluggableMap}
   */
  this.map_ = null;

  /**
   * @private
   * @type {ol.style.Style|Array<ol.style.Style>}
   */
  this.style_ = style;

  /**
   * Draw overlay where our sketch features are drawn.
   * @type {ol.layer.Vector}
   * @private
   */
  this.overlay_ = new ol.layer.Vector({
    source: new ol.source.Vector({
      useSpatialIndex: false,
      wrapX: os.map.PROJECTION.canWrapX()
    }),
    style: style,
    updateWhileAnimating: true,
    updateWhileInteracting: true
  });

  /**
   * @type {ol.Feature}
   * @private
   */
  this.feature_ = new ol.Feature();
};
goog.inherits(os.olm.render.BaseShape, goog.Disposable);


/**
 * @inheritDoc
 */
os.olm.render.BaseShape.prototype.disposeInternal = function() {
  this.setMap(null);
};


/**
 * @protected
 */
os.olm.render.BaseShape.prototype.render = function() {
  var geom = this.getGeometry();
  var overlaySource = this.overlay_.getSource();
  overlaySource.clear(true);

  if (this.map_ !== null && geom) {
    this.feature_.setGeometry(geom);
    this.feature_.setStyle(this.getStyle());
    overlaySource.addFeature(this.feature_);
  }
};


/**
 * @return {ol.PluggableMap} The map
 */
os.olm.render.BaseShape.prototype.getMap = function() {
  return this.map_;
};


/**
 * @param {ol.PluggableMap} map Map.
 *
 * @suppress {accessControls}
 */
os.olm.render.BaseShape.prototype.setMap = function(map) {
  this.overlay_.setMap(map);
  // update the wrap value in the event that the projection has changed since creation
  this.overlay_.getSource().wrapX_ = os.map.PROJECTION.canWrapX();
  this.map_ = map;
  this.render();
};


/**
 * @abstract
 * @return {ol.geom.Geometry} The geometry to draw
 */
os.olm.render.BaseShape.prototype.getGeometry = function() {};


/**
 * @return {ol.style.Style|Array<ol.style.Style>} The style
 */
os.olm.render.BaseShape.prototype.getStyle = function() {
  return this.style_;
};

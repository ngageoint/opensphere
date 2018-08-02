goog.provide('os.olm.render.BaseShape');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('ol.events');
goog.require('ol.render.EventType');



/**
 * @constructor
 * @extends {goog.Disposable}
 * @param {ol.style.Style} style Style.
 * @abstract
 */
os.olm.render.BaseShape = function(style) {
  /**
   * @private
   e @type {ol.PluggableMap}
   */
  this.map_ = null;

  /**
   * @private
   * @type {?ol.EventsKey}
   */
  this.listenKey_ = null;

  /**
   * @private
   * @type {ol.style.Style}
   */
  this.style_ = style;
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
  if (!goog.isNull(this.map_) && this.getGeometry()) {
    this.map_.render();
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
 */
os.olm.render.BaseShape.prototype.setMap = function(map) {
  if (!goog.isNull(this.listenKey_)) {
    ol.events.unlistenByKey(this.listenKey_);
    this.listenKey_ = null;
    this.map_.render();
    this.map_ = null;
  }

  this.map_ = map;

  if (this.map_ != null) {
    this.listenKey_ = ol.events.listen(map, ol.render.EventType.POSTCOMPOSE, this.handleMapPostCompose_, this);
    this.render();
  }
};


/**
 * @param {ol.render.Event} event Event.
 * @private
 */
os.olm.render.BaseShape.prototype.handleMapPostCompose_ = function(event) {
  var geometry = this.getGeometry();
  goog.asserts.assert(goog.isDefAndNotNull(geometry));

  var style = this.getStyle();
  goog.asserts.assert(!goog.isNull(style));
  event.vectorContext.setStyle(style);
  this.adjustStyle(event.vectorContext);
  event.vectorContext.drawGeometry(geometry);
};


/**
 * @return {ol.geom.Geometry} The geometry to draw
 */
os.olm.render.BaseShape.prototype.getGeometry = goog.abstractMethod;


/**
 * @return {ol.style.Style} The style
 */
os.olm.render.BaseShape.prototype.getStyle = function() {
  return this.style_;
};


/**
 * @param {ol.render.VectorContext} context The vector context
 */
os.olm.render.BaseShape.prototype.adjustStyle = function(context) {
};

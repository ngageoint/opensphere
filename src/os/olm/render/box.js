// FIXME add rotation

goog.provide('os.olm.render.Box');

goog.require('goog.Disposable');
goog.require('ol.geom.Polygon');
goog.require('ol.render.EventType');
goog.require('os.interpolate');
goog.require('os.olm.render.BaseShape');


/**
 * OL3 changed their box renderer to use the DOM, but that doesn't jive well with how we're using it. This class is a
 * modified copy of the pre-DOM ol.render.Box circa OL3 commit 31a68e21a51ee378c3698354523d185eef52f543.
 *
 * @param {ol.style.Style} style Style.
 * @extends {os.olm.render.BaseShape}
 * @constructor
 */
os.olm.render.Box = function(style) {
  os.olm.render.Box.base(this, 'constructor', style);

  /**
   * @private
   * @type {ol.geom.Polygon}
   */
  this.geometry_ = null;

  /**
   * @private
   * @type {ol.geom.Polygon}
   */
  this.originalGeometry_ = null;
};
goog.inherits(os.olm.render.Box, os.olm.render.BaseShape);


/**
 * @inheritDoc
 */
os.olm.render.Box.prototype.getGeometry = function() {
  return this.geometry_;
};


/**
 * @return {ol.geom.Polygon} Geometry
 */
os.olm.render.Box.prototype.getOriginalGeometry = function() {
  return this.originalGeometry_;
};


/**
 * @param {!ol.Extent} extent The extent in lonlat
 */
os.olm.render.Box.prototype.setLonLatExtent = function(extent) {
  this.originalGeometry_ = ol.geom.Polygon.fromExtent(extent);
  this.originalGeometry_.osTransform();
  this.geometry_ = this.originalGeometry_.clone();

  // "boxes" are really rhumb boxes, so ensure that we interpolate with the proper method.
  // The interpolation ensures that the box segments are still rendered as rhumb lines even in
  // projections in which rhumb lines are complex curves.
  //
  // Vertical and horizontal rhumbs in EPSG:4326 and EPSG:3857 are both straight lines, so the
  // interpolation will be a no-op in those projections.

  os.interpolate.beginTempInterpolation(undefined, os.interpolate.Method.RHUMB);
  os.interpolate.interpolateGeom(this.geometry_);
  os.interpolate.endTempInterpolation();
  this.render();
};

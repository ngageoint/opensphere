// FIXME add rotation

goog.provide('os.olm.render.Circle');

goog.require('goog.Disposable');
goog.require('ol.Sphere');
goog.require('ol.geom.Circle');
goog.require('ol.render.Event');
goog.require('ol.render.EventType');
goog.require('ol.style.Fill');
goog.require('ol.style.Text');
goog.require('os.math.Units');
goog.require('os.olm.render.BaseShape');
goog.require('os.unit.UnitManager');



/**
 * @constructor
 * @extends {os.olm.render.BaseShape}
 * @param {ol.style.Style} style Style.
 * @param {string=} opt_units - units for text
 */
os.olm.render.Circle = function(style, opt_units) {
  os.olm.render.Circle.base(this, 'constructor', style);

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.startCoord_ = null;

  /**
   * @private
   * @type {ol.Coordinate}
   */
  this.endCoord_ = null;

  /**
   * @private
   * @type {number}
   */
  this.distance_ = -1;

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

  /**
   * @private
   * @type {null | string}
   */
  this.units_ = opt_units || null;
};
goog.inherits(os.olm.render.Circle, os.olm.render.BaseShape);


/**
 * @type {ol.Sphere}
 * @const
 */
os.olm.render.Circle.WGS84_SPHERE = new ol.Sphere(6378137);


/**
 * @protected
 * @return {ol.geom.Polygon} Geometry.
 */
os.olm.render.Circle.prototype.createGeometry = function() {
  var map = this.getMap();
  goog.asserts.assert(!goog.isNull(this.startCoord_));
  goog.asserts.assert(!goog.isNull(this.endCoord_));
  goog.asserts.assert(!goog.isNull(map));

  var projection = map.getView().getProjection();
  var start = ol.proj.toLonLat(this.startCoord_, projection);
  var end = ol.proj.toLonLat(this.endCoord_, projection);

  this.distance_ = osasm.geodesicInverse(start, end).distance;

  var poly = ol.geom.Polygon.circular(os.olm.render.Circle.WGS84_SPHERE, start, this.distance_);
  poly.osTransform();

  return poly;
};


/**
 * @inheritDoc
 */
os.olm.render.Circle.prototype.adjustStyle = function(context) {
  var um = os.unit.UnitManager.getInstance();
  if (this.units_) {
    context.setTextStyle(new ol.style.Text({
      fill: new ol.style.Fill({
        color: [0, 0xff, 0xff, 1]
      }),
      text: um.formatToBestFit('distance', this.distance_, 'm', um.getBaseSystem(), 3)
    }));
  }
};


/**
 * @inheritDoc
 */
os.olm.render.Circle.prototype.getGeometry = function() {
  return this.geometry_;
};


/**
 * @return {ol.geom.Polygon} The original geometry (before interpolation)
 */
os.olm.render.Circle.prototype.getOriginalGeometry = function() {
  return this.originalGeometry_;
};


/**
 * @param {ol.Coordinate} startCoord Start coordinate.
 * @param {ol.Coordinate} endCoord End coordinate.
 */
os.olm.render.Circle.prototype.setCoordinates = function(startCoord, endCoord) {
  this.startCoord_ = startCoord;
  this.endCoord_ = endCoord;
  this.originalGeometry_ = this.createGeometry();
  this.geometry_ = this.originalGeometry_.clone();
  os.interpolate.interpolateGeom(this.geometry_);
  this.render();
};


/**
 * @param {string} units The text overlay units.
 */
os.olm.render.Circle.prototype.setUnits = function(units) {
  this.units_ = units;
};

goog.provide('os.geom.Ellipse');

goog.require('ol.geom.Polygon');
goog.require('os.geo');



/**
 * Ellipse geometry.
 * @param {!ol.Coordinate} center The ellipse center point.
 * @param {number} semiMajor The semi-major radius, in meters.
 * @param {number=} opt_semiMinor The semi-minor radius, in meters. If not provided, semi-major will be used.
 * @param {number=} opt_orientation The ellipse orientation, in degrees.
 * @extends {ol.geom.Polygon}
 * @constructor
 */
os.geom.Ellipse = function(center, semiMajor, opt_semiMinor, opt_orientation) {
  os.geom.Ellipse.base(this, 'constructor', null);

  /**
   * The center point of the ellipse.
   * @type {!ol.Coordinate}
   * @protected
   */
  this.center = center;

  /**
   * The semi-major axis of the ellipse.
   * @type {number}
   * @protected
   */
  this.semiMajor = semiMajor;

  /**
   * The semi-major axis of the ellipse.
   * @type {number}
   * @protected
   */
  this.semiMinor = opt_semiMinor != null ? opt_semiMinor : semiMajor;

  /**
   * The orientation of the ellipse.
   * @type {number}
   * @protected
   */
  this.orientation = opt_orientation || 0;

  this.interpolateEllipse();
};
goog.inherits(os.geom.Ellipse, ol.geom.Polygon);


/**
 * Return a copy of the ellipse as its base type, ol.geom.Polygon
 * @param {os.geom.Ellipse} ellipse The ellipse to translate.
 * @return {!ol.geom.Polygon} polygon The ellipse as a polygon.
 */
os.geom.Ellipse.toPolygon = function(ellipse) {
  return new ol.geom.Polygon(ellipse.getCoordinates());
};


/**
 * @inheritDoc
 */
os.geom.Ellipse.prototype.clone = function() {
  return new os.geom.Ellipse(this.center, this.semiMajor, this.semiMinor, this.orientation);
};


/**
 * Interpolate the ellipse as a polygon, for display in Openlayers.
 */
os.geom.Ellipse.prototype.interpolateEllipse = function() {
  var ellipseCoords = os.geo.interpolateEllipse(this.center, this.semiMajor, this.semiMinor, this.orientation);
  this.setCoordinates([ellipseCoords]);
  this.osTransform();
};


/**
 * Get the center point.
 * @return {!ol.Coordinate}
 */
os.geom.Ellipse.prototype.getCenter = function() {
  return this.center;
};


/**
 * Set the center point.
 * @param {!ol.Coordinate} value The new value.
 */
os.geom.Ellipse.prototype.setCenter = function(value) {
  this.center = value;
};


/**
 * Get the semi-major axis.
 * @return {number}
 */
os.geom.Ellipse.prototype.getSemiMajor = function() {
  return this.semiMajor;
};


/**
 * Set the semi-major axis.
 * @param {number} value The new value.
 */
os.geom.Ellipse.prototype.setSemiMajor = function(value) {
  this.semiMajor = value;
};


/**
 * Get the semi-minor axis.
 * @return {number}
 */
os.geom.Ellipse.prototype.getSemiMinor = function() {
  return this.semiMinor;
};


/**
 * Set the semi-minor axis.
 * @param {number} value The new value.
 */
os.geom.Ellipse.prototype.setSemiMinor = function(value) {
  this.semiMinor = value;
};


/**
 * Get the orientation.
 * @return {number}
 */
os.geom.Ellipse.prototype.getOrientation = function() {
  return this.orientation;
};


/**
 * Set the orientation.
 * @param {number} value The new value.
 */
os.geom.Ellipse.prototype.setOrientation = function(value) {
  this.orientation = value;
};

goog.declareModuleId('os.geom.Ellipse');

import Polygon from 'ol/src/geom/Polygon.js';

import * as geo from '../geo/geo.js';


/**
 * Ellipse geometry.
 *
 * The Ellipse coordinates are generated in the map projection.
 */
export default class Ellipse extends Polygon {
  /**
   * Constructor.
   * @param {!ol.Coordinate} center The ellipse center point, in longitude / latitude.
   * @param {number} semiMajor The semi-major radius, in meters.
   * @param {number=} opt_semiMinor The semi-minor radius, in meters. If not provided, semi-major will be used.
   * @param {number=} opt_orientation The ellipse orientation, in degrees from true north. 0 if not provided.
   */
  constructor(center, semiMajor, opt_semiMinor, opt_orientation) {
    super([]);

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
     * The orientation of the ellipse, major axis from true north, in degrees.
     * @type {number}
     * @protected
     */
    this.orientation = opt_orientation || 0;

    this.interpolateEllipse();
  }

  /**
   * @inheritDoc
   */
  clone() {
    return new Ellipse(this.center, this.semiMajor, this.semiMinor, this.orientation);
  }

  /**
   * Interpolate the ellipse as a polygon, for display in Openlayers.
   */
  interpolateEllipse() {
    var ellipseCoords = geo.interpolateEllipse(this.center, this.semiMajor, this.semiMinor, this.orientation);
    this.setCoordinates([ellipseCoords]);
    this.osTransform();
  }

  /**
   * Get the center point.
   *
   * @return {!ol.Coordinate}
   */
  getCenter() {
    return this.center;
  }

  /**
   * Set the center point.
   *
   * @param {!ol.Coordinate} value The new value.
   */
  setCenter(value) {
    this.center = value;
  }

  /**
   * Get the semi-major axis.
   *
   * @return {number}
   */
  getSemiMajor() {
    return this.semiMajor;
  }

  /**
   * Set the semi-major axis.
   *
   * @param {number} value The new value.
   */
  setSemiMajor(value) {
    this.semiMajor = value;
  }

  /**
   * Get the semi-minor axis.
   *
   * @return {number}
   */
  getSemiMinor() {
    return this.semiMinor;
  }

  /**
   * Set the semi-minor axis.
   *
   * @param {number} value The new value.
   */
  setSemiMinor(value) {
    this.semiMinor = value;
  }

  /**
   * Get the orientation.
   *
   * @return {number} orientation in degrees from true north.
   */
  getOrientation() {
    return this.orientation;
  }

  /**
   * Set the orientation.
   *
   * @param {number} value The new value in degrees from true north.
   */
  setOrientation(value) {
    this.orientation = value;
  }

  /**
   * Return a copy of the ellipse as its base type, Polygon
   *
   * @param {Ellipse} ellipse The ellipse to translate.
   * @return {!Polygon} polygon The ellipse as a polygon.
   */
  static toPolygon(ellipse) {
    return new Polygon(ellipse.getCoordinates());
  }
}


/**
 * Type string for ellipses
 * @const {string}
 */
Ellipse.TYPE = 'ellipse';

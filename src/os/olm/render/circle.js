/* FIXME add rotation */
goog.declareModuleId('os.olm.render.Circle');

import {circular} from 'ol/src/geom/Polygon.js';
import {toLonLat} from 'ol/src/proj.js';
import {DEFAULT_RADIUS} from 'ol/src/sphere.js';

import {interpolateGeom} from '../../interpolate.js';
import UnitManager from '../../unit/unitmanager.js';
import BaseShape from './baseshape.js';

const {assert} = goog.require('goog.asserts');

/**
 */
export default class Circle extends BaseShape {
  /**
   * Constructor.
   * @param {Array<Style>|Style} style Style.
   * @param {string=} opt_units - units for text
   */
  constructor(style, opt_units) {
    super(style);

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
     * @type {Polygon}
     */
    this.geometry_ = null;

    /**
     * @private
     * @type {Polygon}
     */
    this.originalGeometry_ = null;
  }

  /**
   * @protected
   * @return {Polygon} Geometry.
   */
  createGeometry() {
    var map = this.getMap();
    assert(this.startCoord_ !== null);
    assert(this.endCoord_ !== null);
    assert(map !== null);

    var projection = map.getView().getProjection();
    var start = toLonLat(this.startCoord_, projection);
    var end = toLonLat(this.endCoord_, projection);

    this.distance_ = osasm.geodesicInverse(start, end).distance;

    var poly = circular(start, this.distance_);
    poly.osTransform();

    return poly;
  }

  /**
   * @protected
   */
  adjustStyle() {
    var um = UnitManager.getInstance();
    var style = this.getStyle();

    var styles = Array.isArray(style) ? style : [style];
    var value = um.formatToBestFit('distance', this.distance_, 'm', um.getBaseSystem(), 3);

    for (var i = 0, ii = styles.length; i < ii; i++) {
      var text = styles[i].getText();
      if (text) {
        text.setText(value);
      }
    }
  }

  /**
   * @inheritDoc
   */
  getGeometry() {
    return this.geometry_;
  }

  /**
   * @return {Polygon} The original geometry (before interpolation)
   */
  getOriginalGeometry() {
    return this.originalGeometry_;
  }

  /**
   * @param {ol.Coordinate} startCoord Start coordinate.
   * @param {ol.Coordinate} endCoord End coordinate.
   */
  setCoordinates(startCoord, endCoord) {
    this.startCoord_ = startCoord;
    this.endCoord_ = endCoord;
    this.originalGeometry_ = this.createGeometry();
    this.geometry_ = this.originalGeometry_.clone();
    interpolateGeom(this.geometry_);
    this.adjustStyle();
    this.render();
  }
}

/**
 * @type {Sphere}
 * @const
 */
Circle.WGS84_SPHERE = DEFAULT_RADIUS;

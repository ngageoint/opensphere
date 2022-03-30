/* FIXME add rotation */
goog.declareModuleId('os.olm.render.Box');

import {beginTempInterpolation, endTempInterpolation, interpolateGeom} from '../../interpolate.js';
import Method from '../../interpolatemethod.js';
import BaseShape from './baseshape.js';

/**
 * OL changed their box renderer to use the DOM, but that doesn't jive well with how we're using it. This class is a
 * modified copy of the pre-DOM ol.render.Box circa OL commit 31a68e21a51ee378c3698354523d185eef52f543.
 */
export default class Box extends BaseShape {
  /**
   * Constructor.
   * @param {Style} style Style.
   */
  constructor(style) {
    super(style);

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
   * @inheritDoc
   */
  getGeometry() {
    return this.geometry_;
  }

  /**
   * @return {Polygon} Geometry
   */
  getOriginalGeometry() {
    return this.originalGeometry_;
  }

  /**
   * @param {!Polygon} geometry The geometry
   */
  updateGeometry(geometry) {
    this.originalGeometry_ = geometry;
    this.originalGeometry_.osTransform();
    this.geometry_ = this.originalGeometry_.clone();

    // "boxes" are really rhumb boxes, so ensure that we interpolate with the proper method.
    // The interpolation ensures that the box segments are still rendered as rhumb lines even in
    // projections in which rhumb lines are complex curves.
    //
    // Vertical and horizontal rhumbs in EPSG:4326 and EPSG:3857 are both straight lines, so the
    // interpolation will be a no-op in those projections.

    beginTempInterpolation(undefined, Method.RHUMB);
    interpolateGeom(this.geometry_);
    endTempInterpolation();
    this.render();
  }
}

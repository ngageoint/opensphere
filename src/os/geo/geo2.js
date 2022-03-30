/**
 * @fileoverview This is intended to eventually replace os.geo with equivalent functions
 * which are entirely projection-agnostic rather than requiring conversion to lonlat and
 * back when using them.
 */
goog.declareModuleId('os.geo2');

import GeometryType from 'ol/src/geom/GeometryType.js';
import {get as getProjection} from 'ol/src/proj.js';

import GeometryField from '../geom/geometryfield.js';
import * as osMap from '../map/map.js';
import {isWorldQuery} from '../query/queryutils.js';


/**
 * @param {number} lon
 * @param {number=} opt_min
 * @param {number=} opt_max
 * @param {ol.ProjectionLike=} opt_proj
 * @return {number}
 */
export const normalizeLongitude = function(lon, opt_min, opt_max, opt_proj) {
  opt_proj = getProjection(opt_proj || osMap.PROJECTION);
  var projExtent = opt_proj.getExtent();
  opt_min = opt_min != null ? opt_min : projExtent[0];
  opt_max = opt_max != null ? opt_max : projExtent[2];
  var width = opt_max - opt_min;

  // Note: OpenLayers uses this same method in ol/renderer/map.js
  var worldsAway = Math.ceil((opt_min - lon) / width);
  lon += width * worldsAway;

  return lon;
};

/**
 * Clamps latitude to the projection bounds
 *
 * @param {number} lat
 * @param {number=} opt_min
 * @param {number=} opt_max
 * @param {ol.ProjectionLike=} opt_proj
 * @return {number}
 */
export const normalizeLatitude = function(lat, opt_min, opt_max, opt_proj) {
  opt_proj = getProjection(opt_proj || osMap.PROJECTION);
  var projExtent = opt_proj.getExtent();
  opt_min = opt_min != null ? opt_min : projExtent[1];
  opt_max = opt_max != null ? opt_max : projExtent[3];
  return Math.min(Math.max(lat, opt_min), opt_max);
};

/**
 * @param {?Array<number>} coordinate
 * @param {number=} opt_to
 * @param {ol.ProjectionLike=} opt_proj
 */
export const normalizeCoordinate = function(coordinate, opt_to, opt_proj) {
  opt_proj = getProjection(opt_proj || osMap.PROJECTION);

  var projExtent = opt_proj.getExtent();
  var halfWidth = (projExtent[2] - projExtent[0]) / 2;
  opt_to = opt_to != null ? opt_to : projExtent[0] + halfWidth;
  coordinate[0] = normalizeLongitude(coordinate[0], opt_to - halfWidth, opt_to + halfWidth, opt_proj);
  coordinate[1] = normalizeLatitude(coordinate[1], undefined, undefined, opt_proj);
};

/**
 * Normalize a set of coordinates
 *
 * @param {?Array<Array<number>>} coordinates The coordinates to normalize
 * @param {number=} opt_to The longitude to normalize to
 * @param {ol.ProjectionLike=} opt_proj
 */
export const normalizeCoordinates = function(coordinates, opt_to, opt_proj) {
  if (coordinates && coordinates.length > 0) {
    opt_proj = getProjection(opt_proj || osMap.PROJECTION);

    for (var i = 0, n = coordinates.length; i < n; i++) {
      normalizeCoordinate(coordinates[i], opt_to, opt_proj);
      opt_to = opt_to != null ? opt_to : coordinates[0][0];
    }
  }
};

/**
 * @param {?Array<?Array<Array<number>>>} rings The rings to normalize
 * @param {number=} opt_to The longitude to normalize to
 * @param {ol.ProjectionLike=} opt_proj
 */
export const normalizeRings = function(rings, opt_to, opt_proj) {
  if (rings) {
    opt_proj = getProjection(opt_proj || osMap.PROJECTION);

    for (var i = 0, n = rings.length; i < n; i++) {
      normalizeCoordinates(rings[i], opt_to, opt_proj);
      opt_to = opt_to != null ? opt_to : rings[0][0][0];
    }
  }
};

/**
 * @param {?Array<?Array<?Array<Array<number>>>>} polys The polygons to normalize.
 * @param {number=} opt_to The longitude to normalize to.
 * @param {ol.ProjectionLike=} opt_proj
 */
export const normalizePolygons = function(polys, opt_to, opt_proj) {
  if (polys) {
    opt_proj = getProjection(opt_proj || osMap.PROJECTION);

    for (var i = 0, n = polys.length; i < n; i++) {
      normalizeRings(polys[i], opt_to, opt_proj);
      opt_to = opt_to != null ? opt_to : polys[0][0][0][0];
    }
  }
};

/**
 * Returns true if geometry coordinates are normlized.
 *
 * @param {Geometry|undefined} geometry The geometry to normalize.
 * @param {number=} opt_to The longitude to normalize to.
 * @param {ol.ProjectionLike=} opt_proj
 * @return {boolean} If the geometry was normalized.
 */
export const normalizeGeometryCoordinates = function(geometry, opt_to, opt_proj) {
  if (geometry) {
    if (geometry.get(GeometryField.NORMALIZED) || isWorldQuery(geometry)) {
      return false;
    }

    opt_proj = getProjection(opt_proj || osMap.PROJECTION);

    switch (geometry.getType()) {
      case GeometryType.POINT:
        var point = /** @type {Point} */ (geometry);
        var coord = /** @type {Array<number>} */ (point.getCoordinates());
        normalizeCoordinate(coord, opt_to, opt_proj);
        point.setCoordinates(coord);
        return true;
      case GeometryType.LINE_STRING:
      case GeometryType.MULTI_POINT:
        var lineString = /** @type {LineString|MultiPoint} */ (geometry);
        var coordinates = lineString.getCoordinates();
        normalizeCoordinates(coordinates, opt_to, opt_proj);
        lineString.setCoordinates(coordinates);
        return true;
      case GeometryType.POLYGON:
      case GeometryType.MULTI_LINE_STRING:
        var polygon = /** @type {Polygon|MultiLineString} */ (geometry);
        var /** @type {?Array<?Array<Array<number>>>} */ rings = polygon.getCoordinates();
        normalizeRings(rings, opt_to, opt_proj);
        polygon.setCoordinates(rings);
        return true;
      case GeometryType.MULTI_POLYGON:
        var multiPolygon = /** @type {MultiPolygon } */ (geometry);
        var polygons = /** @type {?Array<?Array<?Array<Array<number>>>>} */ (
          multiPolygon.getCoordinates());
        normalizePolygons(polygons, opt_to, opt_proj);
        multiPolygon.setCoordinates(polygons);
        return true;
      case GeometryType.GEOMETRY_COLLECTION:
        var geometryCollection = /** @type {GeometryCollection} */ (geometry);
        var /** @type {Array<Geometry>} */ geometries = geometryCollection.getGeometriesArray();
        for (var i = 0, n = geometries.length; i < n; i++) {
          normalizeGeometryCoordinates(geometries[i], opt_to);
        }
        return true;
      case 'Circle':
      default:
        break;
    }
  }

  return false;
};

/**
 * @enum {boolean}
 */
export const WindingOrder = {
  CLOCKWISE: true,
  COUNTER_CLOCKWISE: false
};

/**
 * @param {Array<Array<number>>} ring
 * @return {number}
 */
export const computeArea = function(ring) {
  var length = ring.length;
  var area = 0.0;
  for (var i0 = length - 1, i1 = 0; i1 < length; i0 = i1++) {
    var v0 = ring[i0];
    var v1 = ring[i1];

    area += (v0[0] * v1[1]) - (v1[0] * v0[1]);
  }
  return area * 0.5;
};

/**
 * @param {Array<Array<number>>} ring The linear or polygon ring to check
 * @return {WindingOrder}
 */
export const computeWindingOrder = function(ring) {
  var area = computeArea(ring);
  if (area > 0.0) {
    return WindingOrder.COUNTER_CLOCKWISE;
  }
  return WindingOrder.CLOCKWISE;
};

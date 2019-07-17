/**
 * @fileoverview This is intended to eventually replace os.geo with equivalent functions
 * which are entirely projection-agnostic rather than requiring conversion to lonlat and
 * back when using them.
 */
goog.provide('os.geo2');
goog.require('os.map');


/**
 * @param {number} lon
 * @param {number=} opt_min
 * @param {number=} opt_max
 * @param {ol.ProjectionLike=} opt_proj
 * @return {number}
 */
os.geo2.normalizeLongitude = function(lon, opt_min, opt_max, opt_proj) {
  opt_proj = ol.proj.get(opt_proj || os.map.PROJECTION);
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
os.geo2.normalizeLatitude = function(lat, opt_min, opt_max, opt_proj) {
  opt_proj = ol.proj.get(opt_proj || os.map.PROJECTION);
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
os.geo2.normalizeCoordinate = function(coordinate, opt_to, opt_proj) {
  opt_proj = ol.proj.get(opt_proj || os.map.PROJECTION);

  var projExtent = opt_proj.getExtent();
  var halfWidth = (projExtent[2] - projExtent[0]) / 2;
  opt_to = opt_to != null ? opt_to : projExtent[0] + halfWidth;
  coordinate[0] = os.geo2.normalizeLongitude(coordinate[0], opt_to - halfWidth, opt_to + halfWidth, opt_proj);
  coordinate[1] = os.geo2.normalizeLatitude(coordinate[1], undefined, undefined, opt_proj);
};


/**
 * Normalize a set of coordinates
 *
 * @param {?Array<Array<number>>} coordinates The coordinates to normalize
 * @param {number=} opt_to The longitude to normalize to
 * @param {ol.ProjectionLike=} opt_proj
 */
os.geo2.normalizeCoordinates = function(coordinates, opt_to, opt_proj) {
  if (coordinates && coordinates.length > 0) {
    opt_proj = ol.proj.get(opt_proj || os.map.PROJECTION);

    for (var i = 0, n = coordinates.length; i < n; i++) {
      os.geo2.normalizeCoordinate(coordinates[i], opt_to, opt_proj);
      opt_to = opt_to != null ? opt_to : coordinates[0][0];
    }
  }
};


/**
 * @param {?Array<?Array<Array<number>>>} rings The rings to normalize
 * @param {number=} opt_to The longitude to normalize to
 * @param {ol.ProjectionLike=} opt_proj
 */
os.geo2.normalizeRings = function(rings, opt_to, opt_proj) {
  if (rings) {
    opt_proj = ol.proj.get(opt_proj || os.map.PROJECTION);

    for (var i = 0, n = rings.length; i < n; i++) {
      os.geo2.normalizeCoordinates(rings[i], opt_to, opt_proj);
      opt_to = opt_to != null ? opt_to : rings[0][0][0];
    }
  }
};


/**
 * @param {?Array<?Array<?Array<Array<number>>>>} polys The polygons to normalize.
 * @param {number=} opt_to The longitude to normalize to.
 * @param {ol.ProjectionLike=} opt_proj
 */
os.geo2.normalizePolygons = function(polys, opt_to, opt_proj) {
  if (polys) {
    opt_proj = ol.proj.get(opt_proj || os.map.PROJECTION);

    for (var i = 0, n = polys.length; i < n; i++) {
      os.geo2.normalizeRings(polys[i], opt_to, opt_proj);
      opt_to = opt_to != null ? opt_to : polys[0][0][0][0];
    }
  }
};


/**
 * Returns true if geometry coordinates are normlized.
 *
 * @param {ol.geom.Geometry|undefined} geometry The geometry to normalize.
 * @param {number=} opt_to The longitude to normalize to.
 * @param {ol.ProjectionLike=} opt_proj
 * @return {boolean} If the geometry was normalized.
 */
os.geo2.normalizeGeometryCoordinates = function(geometry, opt_to, opt_proj) {
  if (geometry) {
    if (geometry.get(os.geom.GeometryField.NORMALIZED) || os.query.utils.isWorldQuery(geometry)) {
      return false;
    }

    opt_proj = ol.proj.get(opt_proj || os.map.PROJECTION);

    switch (geometry.getType()) {
      case ol.geom.GeometryType.POINT:
        var point = /** @type {ol.geom.Point} */ (geometry);
        var coord = /** @type {Array<number>} */ (point.getCoordinates());
        os.geo2.normalizeCoordinate(coord, opt_to, opt_proj);
        point.setCoordinates(coord);
        return true;
      case ol.geom.GeometryType.LINE_STRING:
      case ol.geom.GeometryType.MULTI_POINT:
        var lineString = /** @type {ol.geom.LineString|ol.geom.MultiPoint} */ (geometry);
        var coordinates = lineString.getCoordinates();
        os.geo2.normalizeCoordinates(coordinates, opt_to, opt_proj);
        lineString.setCoordinates(coordinates);
        return true;
      case ol.geom.GeometryType.POLYGON:
      case ol.geom.GeometryType.MULTI_LINE_STRING:
        var polygon = /** @type {ol.geom.Polygon|ol.geom.MultiLineString} */ (geometry);
        var /** @type {?Array<?Array<Array<number>>>} */ rings = polygon.getCoordinates();
        os.geo2.normalizeRings(rings, opt_to, opt_proj);
        polygon.setCoordinates(rings);
        return true;
      case ol.geom.GeometryType.MULTI_POLYGON:
        var multiPolygon = /** @type {ol.geom.MultiPolygon } */ (geometry);
        var polygons = /** @type {?Array<?Array<?Array<Array<number>>>>} */ (
          multiPolygon.getCoordinates());
        os.geo2.normalizePolygons(polygons, opt_to, opt_proj);
        multiPolygon.setCoordinates(polygons);
        return true;
      case ol.geom.GeometryType.GEOMETRY_COLLECTION:
        var geometryCollection = /** @type {ol.geom.GeometryCollection} */ (geometry);
        var /** @type {Array<ol.geom.Geometry>} */ geometries = geometryCollection.getGeometriesArray();
        for (var i = 0, n = geometries.length; i < n; i++) {
          os.geo2.normalizeGeometryCoordinates(geometries[i], opt_to);
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
 * Check if a polygon caps one of the poles
 *
 * @param {ol.geom.Polygon} polygon
 * @return {boolean}
 */
os.geo2.isPolarPolygon = function(polygon) {
  var proj = /** @type {ol.ProjectionLike} */ (polygon.get(os.geom.GeometryField.PROJECTION) || os.map.PROJECTION);
  var rings = polygon.getCoordinates();
  return rings.length ? os.geo2.isPolarRing(rings[0], proj) : false;
};


/**
 * Check if a polygon caps one of the poles
 *
 * @param {Array<Array<number>>} ring The polygon's exterior ring
 * @param {ol.ProjectionLike=} opt_proj
 * @return {boolean} if the polygon caps a pole
 */
os.geo2.isPolarRing = function(ring, opt_proj) {
  opt_proj = ol.proj.get(opt_proj) || os.map.PROJECTION;
  var extent = opt_proj.getExtent();
  var width = extent[2] - extent[0];
  var total = 0;
  if (ring) {
    for (var i = 1, n = ring.length; i < n; i++) {
      var dx = ring[i][0] - ring[i - 1][0];
      if (dx > extent[2]) {
        dx -= width;
      } else if (dx < extent[0]) {
        dx += width;
      }
      total += dx;
    }
  }

  return Math.abs(total) > 1;
};

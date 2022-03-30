/**
 * @fileoverview This set of functions is for interpolating lines as something that actually makes
 * GIS sense instead of just rendering a straight cartesian line between two points regardless of
 * the projection.
 */
goog.declareModuleId('os.interpolate');

import GeometryType from 'ol/src/geom/GeometryType.js';
import {get, getTransform} from 'ol/src/proj.js';

import * as geo2 from './geo/geo2.js';
import Method from './interpolatemethod.js';
import * as osMap from './map/map.js';
import {EPSG4326} from './proj/proj.js';

/**
 * Interpolation settings keys.
 * @enum {string}
 */
export const SettingsKey = {
  INTERPOLATION: 'interpolation'
};

/**
 * @typedef {{
 *  coordToLonLat: !ol.TransformFunction,
 *  lonLatToCoord: !ol.TransformFunction,
 *  lastProj: string
 * }}
 */
export let TransformSet;

/**
 * Local interpolate config.
 * @type {!Config}
 */
const interpolateConfig = {
  method: Method.GEODESIC,
  distance: 100000 // default to one at least one point every 100 kilometers
};

/**
 * Whether or not the interpolation system is enabled
 * @type {boolean}
 */
let interpolateEnabled = true;

/**
 * If a feature is interpolated, its original geometry will be stored in this field
 * @type {string}
 */
export const ORIGINAL_GEOM_FIELD = '_originalGeometry';

/**
 * The field on a feature which contains the method override
 * @type {string}
 */
export const METHOD_FIELD = 'interpolationMethod';

/**
 * @type {?Method}
 */
let overrideMethod = null;

/**
 * @return {boolean} Whether or not all the values needed for interpolation are present
 */
export const getEnabled = function() {
  return !!(interpolateEnabled && interpolateConfig.distance > 1000);
};

/**
 * Set if interpolation is enabled.
 * @param {boolean} value If interpolation in enabled.
 */
export const setEnabled = function(value) {
  interpolateEnabled = value;
};

/**
 * @return {Method} The interpolation method
 */
export const getMethod = function() {
  return interpolateConfig.method;
};

/**
 * @return {Object<string, *>} The config
 */
export const getConfig = function() {
  return {
    'method': interpolateConfig.method,
    'distance': interpolateConfig.distance
  };
};

/**
 * @param {Object<string, *>} config The config
 */
export const setConfig = function(config) {
  if (config) {
    interpolateConfig.method = /** @type {Method} */ (config['method']) || interpolateConfig.method;
    interpolateConfig.distance = /** @type {number} */ (config['distance']) || interpolateConfig.thresholdPercent;
  }
};

/**
 * @type {?Config}
 */
let tmpConfig = null;

/**
 * Begins a temporary interpolation with a different set of configuration.
 *
 * Do not forget to call os.interpolate.endTempInterpolation() when finished.
 *
 * @param {ol.ProjectionLike=} opt_projection The projection for the coordinates
 * @param {Method=} opt_method The interpolation method
 * @param {number=} opt_distance The distance between interpolated points in meters
 */
export const beginTempInterpolation = function(opt_projection, opt_method, opt_distance) {
  var config = interpolateConfig;

  tmpConfig = {
    method: opt_method || config.method,
    distance: opt_distance || config.distance
  };

  if (opt_projection) {
    var projection = get(opt_projection || osMap.PROJECTION);

    tmpTransforms = ({
      coordToLonLat: getTransform(projection, EPSG4326),
      lonLatToCoord: getTransform(EPSG4326, projection),
      lastProj: projection.getCode()
    });
  }
};

/**
 * Finish temporary interpolation
 */
export const endTempInterpolation = function() {
  tmpConfig = null;
  tmpTransforms = null;
};

/**
 * @param {ol.Feature} feature The feature to modify
 * @param {boolean=} opt_skipUpdate Skips updating the transforms, useful when calling in batches
 */
export const interpolateFeature = function(feature, opt_skipUpdate) {
  if (!getEnabled()) {
    return;
  }

  var field = METHOD_FIELD;
  var featureMethod = /** @type {?Method} */ (feature.get(field) || null);
  if (featureMethod === Method.NONE) {
    // ensure that the geometry is also marked this way
    var geom = feature.getGeometry();
    if (geom) {
      geom.set(field, Method.NONE, true);
    }

    return;
  }

  if (!opt_skipUpdate) {
    updateTransforms();
  }

  geom = /** @type {ol.geom.Geometry} */ (feature.get(ORIGINAL_GEOM_FIELD));

  if (!geom) {
    // We need to preserve the original geometry on the feature so that we can redo the interpolation
    // if the user changes any interpolation parameters for the feature or for the application.
    geom = feature.getGeometry();

    if (!geom) {
      return;
    }

    // if the geometry is something we clearly can't interpolate, then skip it
    var type = geom.getType();
    if (type === GeometryType.POINT || type === GeometryType.MULTI_POINT) {
      return;
    }

    if (geom) {
      feature.set(ORIGINAL_GEOM_FIELD, geom.clone());
    }
  } else {
    geom = geom.clone();
  }

  if (geom) {
    // some features contain their own method override (e.g. GEODESIC is selected for general interpolation,
    // but rhumb boxes or measured rhumb lines may want to override that setting
    overrideMethod = featureMethod;
    interpolateGeom(geom);
    overrideMethod = null;

    var tmp = tmpConfig;
    var config = interpolateConfig;

    if (tmp && tmp.method !== config.method) {
      feature.set(field, tmp.method);
    }

    feature.setGeometry(geom);
    feature.changed();
  }
};

/**
 * @param {ol.geom.Geometry} geom The geometry to interpolate
 * @param {boolean=} opt_skipUpdate Skips updating the transforms, useful when calling in batches
 */
export const interpolateGeom = function(geom, opt_skipUpdate) {
  if (!opt_skipUpdate) {
    updateTransforms();
  }

  var field = METHOD_FIELD;
  var geomMethod = /** @type {?Method} */ (geom.get(field) || null);
  if (geomMethod === Method.NONE) {
    return;
  }

  var type = geom.getType();
  switch (type) {
    case GeometryType.GEOMETRY_COLLECTION:
      var geoms = /** @type {ol.geom.GeometryCollection} */ (geom).getGeometries();
      geoms.forEach(interpolateGeomInternal_);
      /** @type {ol.geom.GeometryCollection} */ (geom).setGeometries(geoms);
      break;
    case GeometryType.MULTI_POLYGON:
      var polys = /** @type {ol.geom.MultiPolygon} */ (geom).getCoordinates();
      polys.forEach(interpolateRings);
      /** @type {ol.geom.MultiPolygon} */ (geom).setCoordinates(polys);
      break;
    case GeometryType.MULTI_LINE_STRING:
      var lines = /** @type {ol.geom.MultiLineString} */ (geom).getCoordinates();
      lines.forEach(interpolateLine);
      /** @type {ol.geom.MultiLineString} */ (geom).setCoordinates(lines);
      break;
    case GeometryType.POLYGON:
      var rings = /** @type {ol.geom.Polygon} */ (geom).getCoordinates();
      rings.forEach(interpolateRing);
      /** @type {ol.geom.Polygon} */ (geom).setCoordinates(rings);
      break;
    case GeometryType.LINE_STRING:
      var coords = /** @type {ol.geom.LineString} */ (geom).getCoordinates();
      interpolateLine(coords);
      /** @type {ol.geom.LineString} */ (geom).setCoordinates(coords);
      break;
    default:
      break;
  }
};

/**
 * @param {ol.geom.Geometry} geom The geometry to interpolate
 */
const interpolateGeomInternal_ = function(geom) {
  interpolateGeom(geom, true);
};

/**
 * @type {?TransformSet}
 */
let localTransforms = null;

/**
 * @type {?TransformSet}
 */
let tmpTransforms = null;

/**
 * Updates the transform cache
 *
 * @suppress {accessControls}
 */
export const updateTransforms = function() {
  if (!localTransforms || osMap.PROJECTION.getCode() !== localTransforms.lastProj) {
    localTransforms = {
      coordToLonLat: getTransform(osMap.PROJECTION, EPSG4326),
      lonLatToCoord: getTransform(EPSG4326, osMap.PROJECTION),
      lastProj: osMap.PROJECTION.getCode()
    };
  }
};

/**
 * @param {Array<Array<ol.Coordinate>>} lines The lines to interpolate
 */
export const interpolateLines = function(lines) {
  lines.forEach(interpolateLine);
};

/**
 * @param {Array<Array<ol.Coordinate>>} rings The rings to interpolate
 */
export const interpolateRings = function(rings) {
  rings.forEach(interpolateRing);
};

/**
 * @param {Array<ol.Coordinate>} ring The ring to interpolate
 */
export const interpolateRing = function(ring) {
  interpolateLine(ring);

  // ensure the ring is closed
  if (ring.length) {
    ring[ring.length - 1] = ring[0];
  }
};

/**
 * Interpolates a line segment by inserting points along each segment to ensure that it follows
 * the geodesic or rhumb line along the surface of the earth. Altitude values are interpolated
 * linearly.
 *
 * This function modifies the given line in place.
 *
 * History:
 *
 * This function previously performed a bisecting-interpolation of a line segment, targeting a
 * specific accuracy (in either meters or percentage) of all pixels along the line. This method
 * was problematic due to our use of Cesium. The interpolation was performed entirely in the
 * 2D context with the selected projection. For mercator projections in 2D, rhumb lines are straight
 * lines, and would often have little (or no) extra points inserted. However, Cesium still operates
 * entirely in a 3D vector context and will interpolate between the two points as a geodesic.
 *
 * If the bisecting interpolation method is ever restored, it will need to support a 3D vector
 * context when that view is being shown. It was advantageous in that it provided a way to fully
 * support a target accuracy while minimizing the number of coordinates inserted into the line.
 *
 * @param {Array<ol.Coordinate>} line The line
 */
export const interpolateLine = function(line) {
  var config = tmpConfig || interpolateConfig;
  var transforms = tmpTransforms || localTransforms;
  var method = overrideMethod || config.method;

  var inverse;
  var interpolate;

  if (method === Method.GEODESIC) {
    interpolate = osasm.geodesicInterpolate;
    inverse = osasm.geodesicInverse;
  } else if (method === Method.RHUMB) {
    interpolate = osasm.rhumbInterpolate;
    inverse = osasm.rhumbInverse;
  } else {
    return;
  }

  // yes, i should always be below the indexes we are potentially modifying in this function
  for (var i = line.length - 2; i >= 0; i--) {
    var c1 = line[i];
    var c2 = line[i + 1];

    var lonlat1 = transforms.coordToLonLat(c1, undefined, c1.length);
    var lonlat2 = transforms.coordToLonLat(c2, undefined, c2.length);
    lonlat1.length = 2;
    lonlat2.length = 2;

    var distance = inverse(lonlat1, lonlat2).distance;

    // compute number of points in line
    var num = 1 + Math.ceil(distance / config.distance);

    if (num > 2) {
      var otherDiffs;

      // compute diffs for other values in the coordinates
      var minStride = Math.min(c1.length, c2.length);
      if (minStride > 2) {
        otherDiffs = [];

        for (var j = 2; j < minStride; j++) {
          otherDiffs.push(c2[j] - c1[j]);
        }
      }

      var maxLon = lonlat1[0] + 180;
      var minLon = lonlat1[0] - 180;

      var ptr = osasm._malloc(2 * num * Float64Array.BYTES_PER_ELEMENT);
      interpolate(lonlat1, lonlat2, ptr, num);
      var flatCoords = new Float64Array(osasm.HEAPU8.buffer, ptr, 2 * num);

      var offset = 1;
      for (var j = 2, m = flatCoords.length - 2; j < m; j += 2) {
        var coord = [flatCoords[j], flatCoords[j + 1]];
        coord[0] = geo2.normalizeLongitude(coord[0], minLon, maxLon, EPSG4326);
        coord = transforms.lonLatToCoord(coord);

        // use linear interpolation for other values in the coordinates
        if (otherDiffs) {
          otherDiffs.forEach(function(diff, idx, arr) {
            coord[idx + 2] = c1[idx + 2] + diff * offset / (num - 1);
          });
        }

        line.splice(i + offset, 0, coord);
        offset++;
      }

      osasm._free(ptr);

      lonlat2[0] = geo2.normalizeLongitude(lonlat2[0], minLon, maxLon, EPSG4326);
      coord = transforms.lonLatToCoord(lonlat2, undefined, lonlat2.length);

      if (otherDiffs) {
        otherDiffs.forEach(function(diff, idx, arr) {
          coord[idx + 2] = c2[idx + 2];
        });
      }

      line.splice(i + offset, 1, coord);
    }
  }
};

/**
 * Utility function to manually configure the interpolation settings
 * @param {Array<ol.Coordinate>} line The line
 * @param {!Config} config The config
 */
export const interpolateLineWithConfig = function(line, config) {
  const oldConfig = tmpConfig; // save current settings
  tmpConfig = config; // use these settings
  interpolateLine(line);
  tmpConfig = oldConfig; // restore settings
};

/**
 * @fileoverview This set of functions is for interpolating lines as something that actually makes
 * GIS sense instead of just rendering a straight cartesian line between two points regardless of
 * the projection.
 */

goog.provide('os.interpolate');
goog.provide('os.interpolate.Method');

goog.require('ol.View');
goog.require('ol.transform');
goog.require('os.geo');
goog.require('os.proj');


/**
 * @enum {string}
 */
os.interpolate.Method = {
  GEODESIC: 'geodesic',
  RHUMB: 'rhumb',
  NONE: 'none'
};


/**
 * Interpolation settings keys.
 * @enum {string}
 */
os.interpolate.SettingsKey = {
  INTERPOLATION: 'interpolation'
};


/**
 * @typedef {{
 *  coordToLonLat: !ol.TransformFunction,
 *  lonLatToCoord: !ol.TransformFunction,
 *  lastProj: string
 * }}
 */
os.interpolate.TransformSet;


/**
 * @typedef {{
 *  method: os.interpolate.Method,
 *  distance: number
 * }}
 */
os.interpolate.Config;


/**
 * @type {!os.interpolate.Config}
 * @private
 */
os.interpolate.config_ = {
  method: os.interpolate.Method.GEODESIC,
  distance: 100000 // default to one at least one point every 100 kilometers
};


/**
 * Whether or not the interpolation system is enabled
 * @type {boolean}
 * @private
 */
os.interpolate.enabled_ = true;


/**
 * If a feature is interpolated, its original geometry will be stored in this field
 * @type {string}
 * @const
 */
os.interpolate.ORIGINAL_GEOM_FIELD = '_originalGeometry';


/**
 * The field on a feature which contains the method override
 * @type {string}
 * @const
 */
os.interpolate.METHOD_FIELD = 'interpolationMethod';


/**
 * @type {?os.interpolate.Method}
 * @private
 */
os.interpolate.overrideMethod_ = null;


/**
 * @return {boolean} Whether or not all the values needed for interpolation are present
 */
os.interpolate.getEnabled = function() {
  var config = os.interpolate.config_;
  return !!(os.interpolate.enabled_ && config.distance > 1000);
};


/**
 * @return {os.interpolate.Method} The interpolation method
 */
os.interpolate.getMethod = function() {
  return os.interpolate.config_.method;
};


/**
 * @return {Object<string, *>} The config
 */
os.interpolate.getConfig = function() {
  return {
    'method': os.interpolate.config_.method,
    'distance': os.interpolate.config_.distance
  };
};


/**
 * @param {Object<string, *>} config The config
 */
os.interpolate.setConfig = function(config) {
  if (config) {
    var config_ = os.interpolate.config_;
    config_.method = /** @type {os.interpolate.Method} */ (config['method']) || config_.method;
    config_.distance = /** @type {number} */ (config['distance']) || config_.thresholdPercent;
  }
};


/**
 * @type {?os.interpolate.Config}
 * @private
 */
os.interpolate.tmpConfig_ = null;


/**
 * Begins a temporary interpolation with a different set of configuration.
 *
 * Do not forget to call os.interpolate.endTempInterpolation() when finished.
 *
 * @param {ol.ProjectionLike=} opt_projection The projection for the coordinates
 * @param {os.interpolate.Method=} opt_method The interpolation method
 * @param {number=} opt_distance The distance between interpolated points in meters
 */
os.interpolate.beginTempInterpolation = function(opt_projection, opt_method, opt_distance) {
  var config = os.interpolate.config_;

  os.interpolate.tmpConfig_ = {
    method: opt_method || config.method,
    distance: opt_distance || config.distance
  };

  if (opt_projection) {
    var projection = ol.proj.get(opt_projection || os.map.PROJECTION);

    os.interpolate.tmpTransforms_ = /** @type {os.interpolate.TransformSet} */ ({
      coordToLonLat: ol.proj.getTransform(projection, os.proj.EPSG4326),
      lonLatToCoord: ol.proj.getTransform(os.proj.EPSG4326, projection),
      lastProj: projection.getCode()
    });
  }
};


/**
 * Finish temporary interpolation
 */
os.interpolate.endTempInterpolation = function() {
  os.interpolate.tmpConfig_ = null;
  os.interpolate.tmpTransforms_ = null;
};


/**
 * @param {ol.Feature} feature The feature to modify
 * @param {boolean=} opt_skipUpdate Skips updating the transforms, useful when calling in batches
 */
os.interpolate.interpolateFeature = function(feature, opt_skipUpdate) {
  if (!os.interpolate.getEnabled()) {
    return;
  }

  var field = os.interpolate.METHOD_FIELD;
  var featureMethod = /** @type {?os.interpolate.Method} */ (feature.get(field) || null);
  if (featureMethod === os.interpolate.Method.NONE) {
    // ensure that the geometry is also marked this way
    var geom = feature.getGeometry();
    if (geom) {
      geom.set(field, os.interpolate.Method.NONE, true);
    }

    return;
  }

  if (!opt_skipUpdate) {
    os.interpolate.updateTransforms();
  }

  geom = /** @type {ol.geom.Geometry} */ (feature.get(os.interpolate.ORIGINAL_GEOM_FIELD));

  if (!geom) {
    // We need to preserve the original geometry on the feature so that we can redo the interpolation
    // if the user changes any interpolation parameters for the feature or for the application.
    geom = feature.getGeometry();

    if (!geom) {
      return;
    }

    // if the geometry is something we clearly can't interpolate, then skip it
    var type = geom.getType();
    if (type === ol.geom.GeometryType.POINT || type === ol.geom.GeometryType.MULTI_POINT) {
      return;
    }

    if (geom) {
      feature.set(os.interpolate.ORIGINAL_GEOM_FIELD, geom.clone());
    }
  } else {
    geom = geom.clone();
  }

  if (geom) {
    // some features contain their own method override (e.g. GEODESIC is selected for general interpolation,
    // but rhumb boxes or measured rhumb lines may want to override that setting
    os.interpolate.overrideMethod_ = featureMethod;
    os.interpolate.interpolateGeom(geom);
    os.interpolate.overrideMethod_ = null;

    var tmp = os.interpolate.tmpConfig_;
    var config = os.interpolate.config_;

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
os.interpolate.interpolateGeom = function(geom, opt_skipUpdate) {
  if (!opt_skipUpdate) {
    os.interpolate.updateTransforms();
  }

  var field = os.interpolate.METHOD_FIELD;
  var geomMethod = /** @type {?os.interpolate.Method} */ (geom.get(field) || null);
  if (geomMethod === os.interpolate.Method.NONE) {
    return;
  }

  var type = geom.getType();
  switch (type) {
    case ol.geom.GeometryType.GEOMETRY_COLLECTION:
      var geoms = /** @type {ol.geom.GeometryCollection} */ (geom).getGeometries();
      geoms.forEach(os.interpolate.interpolateGeomInternal_);
      /** @type {ol.geom.GeometryCollection} */ (geom).setGeometries(geoms);
      break;
    case ol.geom.GeometryType.MULTI_POLYGON:
      var polys = /** @type {ol.geom.MultiPolygon} */ (geom).getCoordinates();
      polys.forEach(os.interpolate.interpolateRings);
      /** @type {ol.geom.MultiPolygon} */ (geom).setCoordinates(polys);
      break;
    case ol.geom.GeometryType.MULTI_LINE_STRING:
      var lines = /** @type {ol.geom.MultiLineString} */ (geom).getCoordinates();
      lines.forEach(os.interpolate.interpolateLine);
      /** @type {ol.geom.MultiLineString} */ (geom).setCoordinates(lines);
      break;
    case ol.geom.GeometryType.POLYGON:
      var rings = /** @type {ol.geom.Polygon} */ (geom).getCoordinates();
      rings.forEach(os.interpolate.interpolateRing);
      /** @type {ol.geom.Polygon} */ (geom).setCoordinates(rings);
      break;
    case ol.geom.GeometryType.LINE_STRING:
      var coords = /** @type {ol.geom.LineString} */ (geom).getCoordinates();
      os.interpolate.interpolateLine(coords);
      /** @type {ol.geom.LineString} */ (geom).setCoordinates(coords);
      break;
    default:
      break;
  }
};


/**
 * @param {ol.geom.Geometry} geom The geometry to interpolate
 * @private
 */
os.interpolate.interpolateGeomInternal_ = function(geom) {
  os.interpolate.interpolateGeom(geom, true);
};


/**
 * @type {?os.interpolate.TransformSet}
 * @private
 */
os.interpolate.transforms_ = null;


/**
 * @type {?os.interpolate.TransformSet}
 * @private
 */
os.interpolate.tmpTransforms_ = null;


/**
 * Updates the transform cache
 * @suppress {accessControls}
 */
os.interpolate.updateTransforms = function() {
  if (!os.interpolate.transforms_ || os.map.PROJECTION.getCode() !== os.interpolate.transforms_.lastProj) {
    os.interpolate.transforms_ = {
      coordToLonLat: ol.proj.getTransform(os.map.PROJECTION, os.proj.EPSG4326),
      lonLatToCoord: ol.proj.getTransform(os.proj.EPSG4326, os.map.PROJECTION),
      lastProj: os.map.PROJECTION.getCode()
    };
  }
};


/**
 * @param {Array<Array<ol.Coordinate>>} lines The lines to interpolate
 */
os.interpolate.interpolateLines = function(lines) {
  lines.forEach(os.interpolate.interpolateLine);
};


/**
 * @param {Array<Array<ol.Coordinate>>} rings The rings to interpolate
 */
os.interpolate.interpolateRings = function(rings) {
  rings.forEach(os.interpolate.interpolateRing);
};


/**
 * @param {Array<ol.Coordinate>} ring The ring to interpolate
 */
os.interpolate.interpolateRing = function(ring) {
  os.interpolate.interpolateLine(ring);

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
os.interpolate.interpolateLine = function(line) {
  var config = os.interpolate.tmpConfig_ || os.interpolate.config_;
  var transforms = os.interpolate.tmpTransforms_ || os.interpolate.transforms_;
  var method = os.interpolate.overrideMethod_ || config.method;

  var inverse;
  var interpolate;

  if (method === os.interpolate.Method.GEODESIC) {
    interpolate = osasm.geodesicInterpolate;
    inverse = osasm.geodesicInverse;
  } else if (method === os.interpolate.Method.RHUMB) {
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
        coord[0] = os.geo.normalizeLongitude(coord[0], minLon, maxLon);
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

      lonlat2[0] = os.geo.normalizeLongitude(lonlat2[0], minLon, maxLon);
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

/**
 * @license
 * Copyright (c) 2011 by The Authors.
 * Published under the LGPL 2.1 license.
 * See /license-notice.txt for the full text of the license notice.
 * See /license.txt for the full text of the license.
 */
goog.declareModuleId('os.geo.jsts');

import * as olExtent from 'ol/src/extent.js';
import Feature from 'ol/src/Feature.js';
import GeometryType from 'ol/src/geom/GeometryType.js';
import MultiPolygon from 'ol/src/geom/MultiPolygon.js';
import Polygon, {fromCircle, fromExtent} from 'ol/src/geom/Polygon.js';
import Projection from 'ol/src/proj/Projection.js';
import {remove as removeTransform, get as getTransform} from 'ol/src/proj/transforms.js';
import {get as getProjection, addProjection, createSafeCoordinateTransform, addCoordinateTransforms} from 'ol/src/proj.js';

import AlertEventSeverity from '../alert/alerteventseverity.js';
import AlertManager from '../alert/alertmanager.js';
import {filterFalsey} from '../fn/fn.js';
import GeometryField from '../geom/geometryfield.js';
import {METHOD_FIELD} from '../interpolate.js';
import Method from '../interpolatemethod.js';
import * as osMap from '../map/map.js';
import {init as initJstsMixin} from '../mixin/jstsmixin.js';
import {EPSG3031, EPSG3413, EPSG4326} from '../proj/proj.js';
import * as geo from './geo.js';
import {normalizeGeometryCoordinates} from './geo2.js';
import OLParser from './olparser.js';

const log = goog.require('goog.log');


// Initialize the JSTS mixin on module load.
initJstsMixin();

/**
 * Logger
 * @type {log.Logger}
 */
const logger = log.getLogger('os.geo.jsts');

/**
 * @enum {string}
 */
export const ErrorMessage = {
  NO_OP: 'Result geometry is unchanged',
  EMPTY: 'Result geometry is empty'
};

/**
 * Regular expression for geometries that should use an absolute value as the buffer distance.
 * @type {RegExp}
 */
export const ABS_BUFFER_REGEX = /(point|linestring)/i;

/**
 * Regular expression for line string geometries.
 * @type {RegExp}
 */
export const LINE_REGEX = /linestring/i;

/**
 * Regular expression for polygonal geometries.
 * @type {RegExp}
 */
export const POLYGON_REGEX = /polygon/i;

/**
 * Width of a UTM zone in degrees.
 *
 * WARNING: If this is changed: TMERC_BUFFER_LIMIT will need to be recalculated by calling
 * <code>osasm.geodesicInverse([0, 0], [0, UTM_WIDTH_DEGREES]).distance;</code>
 *
 * That library is only available asynchronously on startup and so we can't do that here.
 *
 * @type {number}
 */
export const UTM_WIDTH_DEGREES = 6;

/**
 * Maximum number of splits to perform on a geometry when buffering. This is only necessary when performing an inverse
 * buffer, where split zones need to be overlapped.
 * @type {number}
 */
export const UTM_SPLIT_LIMIT = 500;

/**
 * Buffer radius limit for Transverse Mercator projections before accuracy drops below 0.5%.
 *
 * WARNING: If UTM_WIDTH_DEGREES is changed: TMERC_BUFFER_LIMIT will need to be recalculated by calling
 * <code>osasm.geodesicInverse([0, 0], [0, UTM_WIDTH_DEGREES]).distance;</code>
 *
 * That library is only available asynchronously on startup and so we can't do that here.
 *
 * @type {number}
 */
export const TMERC_BUFFER_LIMIT = 663469.9375;

/**
 * Converts an ol.geom.Geometry to an Polygon or MultiPolygon, if possible.
 *
 * @param {Geometry} geometry The geometry to convert
 * @return {Geometry}
 */
export const toPolygon = function(geometry) {
  var polygon = null;

  if (geometry) {
    var geomType = geometry.getType();
    switch (geomType) {
      case GeometryType.LINE_STRING:
        // line strings must have at least 4 coordinates and form a closed loop
        var coords = /** @type {!LineString} */ (geometry).getCoordinates();
        if (coords.length > 3 && geo.isClosed(coords)) {
          // convert closed lines to a polygon
          polygon = new Polygon([coords]);
        }
        break;
      case GeometryType.MULTI_LINE_STRING:
        // MultiLineString applies the same rules as LineString to each line
        var coords = /** @type {!MultiLineString} */ (geometry).getCoordinates();
        var closedCoords = [];
        for (var i = 0; i < coords.length; i++) {
          if (coords[i].length > 3 && geo.isClosed(coords[i])) {
            // only include closed internal lines. others will be discarded.
            closedCoords.push(coords[i]);
          }
        }

        if (closedCoords.length == 1) {
          // one closed line = polygon
          polygon = new Polygon(closedCoords);
        } else if (closedCoords.length > 1) {
          // multiple closed lines = multipolygon
          polygon = new MultiPolygon([closedCoords]);
        }
        break;
      case GeometryType.CIRCLE:
        // OL3 has a direct conversion - woo!
        polygon = fromCircle(/** @type {!Circle} */ (geometry), 64);
        break;
      case GeometryType.GEOMETRY_COLLECTION:
        // convert each internal geometry and merge the results
        var geometries = /** @type {!GeometryCollection} */ (geometry).getGeometriesArray();
        if (geometries) {
          var polygons = [];
          for (var i = 0; i < geometries.length; i++) {
            var current = toPolygon(geometries[i]);
            if (current) {
              var currType = current.getType();
              if (currType == GeometryType.POLYGON) {
                polygons.push(current);
              } else if (currType == GeometryType.MULTI_POLYGON) {
                /** @type {!MultiPolygon} */ (current).getPolygons().forEach(function(poly) {
                  polygons.push(poly);
                });
              }
            }
          }

          if (polygons.length == 1) {
            polygon = polygons[0];
          } else if (polygons.length > 1) {
            polygon = new MultiPolygon([]);
            for (var i = 0; i < polygons.length; i++) {
              polygon.appendPolygon(polygons[i]);
            }
          }
        }
        break;
      case GeometryType.POLYGON:
      case GeometryType.MULTI_POLYGON:
        // already got one!
        polygon = geometry;
        break;
      default:
        // can't convert it :(
        break;
    }
  }

  return polygon;
};

/**
 * Adds the target geometry to the source geometry.
 *
 * @param {Feature} source The feature with the geometry to add to
 * @param {Feature} target The feature with the geometry to add
 * @param {boolean=} opt_replace If the source feature's geometry should be replaced, or a new feature created
 *
 * @return {Feature} The feature with the new geometry
 * @throws {Error} If the add does nothing
 */
export const addTo = function(source, target, opt_replace) {
  var feature = null;
  if (source && target) {
    var geometry = source.getGeometry();
    var targetGeometry = target.getGeometry();

    if (geometry && targetGeometry) {
      var olp = OLParser.getInstance();
      var srcJsts = olp.read(geometry);
      var targetJsts = olp.read(targetGeometry);

      if (!srcJsts.covers(targetJsts)) {
        var jstsGeom = srcJsts.union(targetJsts);
        var newGeometry = olp.write(jstsGeom);
        if (newGeometry) {
          newGeometry = validate(newGeometry);
          newGeometry.set(GeometryField.NORMALIZED, true);
        }

        feature = opt_replace ? source : new Feature();
        feature.setGeometry(newGeometry);
      } else {
        throw new Error(ErrorMessage.NO_OP);
      }
    }
  }

  return feature;
};

/**
 * Removes the target geometry from the source geometry.
 *
 * @param {Feature} source The feature with the geometry to remove from.
 * @param {Feature} target The feature with the geometry to remove.
 * @param {boolean=} opt_replace If the source feature's geometry should be replaced, or a new feature created
 *
 * @return {Feature} The feature with the new geometry
 * @throws {Error} If the remove creates an empty geometry or does nothing
 */
export const removeFrom = function(source, target, opt_replace) {
  var feature = null;
  if (source && target) {
    var geometry = source.getGeometry();
    var targetGeometry = target.getGeometry();

    if (geometry && targetGeometry) {
      var olp = OLParser.getInstance();
      var srcJsts = olp.read(geometry);
      var targetJsts = olp.read(targetGeometry);

      feature = opt_replace ? source : new Feature();

      if (targetJsts.covers(srcJsts)) {
        // if the target geometry covers the source, the result will be empty
        throw new Error(ErrorMessage.EMPTY);
      } else if (srcJsts.contains(targetJsts) || srcJsts.crosses(targetJsts) || srcJsts.overlaps(targetJsts)) {
        var jstsGeom = srcJsts.difference(targetJsts);
        if (jstsGeom && !jstsGeom.isEmpty()) {
          var newGeometry = olp.write(jstsGeom);
          if (newGeometry) {
            newGeometry = validate(newGeometry);
            newGeometry.set(GeometryField.NORMALIZED, true);
          }

          feature.setGeometry(newGeometry);
        } else {
          // result was empty, so flag as such on the feature and don't change the geometry
          throw new Error(ErrorMessage.EMPTY);
        }
      } else {
        throw new Error(ErrorMessage.NO_OP);
      }
    }
  }

  return feature;
};

/**
 * Computes the intersection of two geometries.
 *
 * @param {Feature} source The first feature to intersect
 * @param {Feature} target The second feature to intersect
 * @param {boolean=} opt_replace If the source feature's geometry should be replaced, or a new feature created
 *
 * @return {Feature} The feature with the new geometry
 * @throws {Error} If the remove creates an empty geometry or does nothing
 */
export const intersect = function(source, target, opt_replace) {
  var feature = null;
  if (source && target) {
    var geometry = source.getGeometry();
    var targetGeometry = target.getGeometry();

    if (geometry && targetGeometry) {
      var olp = OLParser.getInstance();
      var srcJsts = olp.read(geometry);
      var targetJsts = olp.read(targetGeometry);

      feature = opt_replace ? source : new Feature();

      if (!targetJsts.intersects(srcJsts)) {
        // if the target geometry doesn't intersect the source, the result will be empty
        throw new Error(ErrorMessage.EMPTY);
      } else {
        var jstsGeom = srcJsts.intersection(targetJsts);
        if (jstsGeom && !jstsGeom.isEmpty()) {
          var newGeometry = olp.write(jstsGeom);
          if (newGeometry) {
            newGeometry = validate(newGeometry);
            newGeometry.set(GeometryField.NORMALIZED, true);
          }

          feature.setGeometry(newGeometry);
        } else {
          // result was empty, so flag as such on the feature and don't change the geometry
          throw new Error(ErrorMessage.EMPTY);
        }
      }
    }
  }

  return feature;
};

/**
 * Splits a geometry within a projection extent, creating a multi-geometry normalized within the extent.
 * @param {Geometry} geometry The geometry.
 * @param {ol.ProjectionLike=} opt_proj The geometry projection.
 * @return {Geometry} The split geometry, or the original if it was already within the extent.
 */
export const splitWithinWorldExtent = function(geometry, opt_proj) {
  if (geometry) {
    var olp = OLParser.getInstance();
    var jstsGeometry = olp.read(geometry);

    var projection = getProjection(opt_proj || osMap.PROJECTION);
    var projExtent = projection.getExtent();
    var extentPoly = fromExtent(projExtent);
    var jstsExtentPoly = olp.read(extentPoly);

    if (!jstsExtentPoly.contains(jstsGeometry)) {
      // Compute the difference (outside the projection extent) and intersection (inside the extent).
      var difference = jstsGeometry.difference(jstsExtentPoly);
      var intersection = jstsGeometry.intersection(jstsExtentPoly);

      if (difference.getCoordinates().length && intersection.getCoordinates().length) {
        // The difference is outside the projection's extent, so normalize it within the extent.
        var olDifference = /** @type {Polygon|MultiPolygon} */ (olp.write(difference));
        normalizeGeometryCoordinates(olDifference, undefined, projection);

        // The intersection should already be within the projection's extent, and not require normalization.
        var olIntersection = /** @type {Polygon|MultiPolygon} */ (olp.write(intersection));

        var resultCoords = [];

        // These can be a single Polygon or a MultiPolygon, so handle both cases.
        var diffCoords = olDifference.getCoordinates();
        if (diffCoords) {
          if (olDifference instanceof MultiPolygon) {
            resultCoords.push(...diffCoords);
          } else {
            resultCoords.push(diffCoords);
          }
        }

        var intCoords = olIntersection.getCoordinates();
        if (intCoords) {
          if (olIntersection instanceof MultiPolygon) {
            resultCoords.push(...intCoords);
          } else {
            resultCoords.push(intCoords);
          }
        }

        var result = new MultiPolygon(resultCoords);

        // Preserve interpolation method from the original geometry.
        result.set(METHOD_FIELD, geometry.get(METHOD_FIELD));

        return result;
      }
    }
  }

  return geometry;
};

/**
 * Merges a list of geometries into a single geometry.
 *
 * @param {Array<Geometry>} geometries The geometries.
 * @return {Geometry} The merged geometry.
 */
export const merge = function(geometries) {
  var result = null;
  if (geometries) {
    try {
      var olp = OLParser.getInstance();
      var polys = geometries.map(function(geometry) {
        // convert all OL3 geometries to JSTS
        return geometry ? olp.read(geometry) : null;
      }).filter(filterFalsey);

      var merged;
      if (polys.length == 1) {
        // only one... use it!
        merged = polys[0];
      } else if (polys.length > 1) {
        // combine all polygons into a single MultiPolygon
        try {
          // this method is by far the fastest, but may fail due to topology exceptions
          merged = new jsts.geom.GeometryCollection(polys, new jsts.geom.GeometryFactory());
          merged = merged.union();
        } catch (e) {
          // if the above fails, try the buffer method which will remove overlaps but executes more slowly
          merged = new jsts.geom.MultiPolygon(polys, new jsts.geom.GeometryFactory());
          merged = merged.buffer(0);
        }
      }

      if (merged) {
        result = olp.write(merged);
      }
    } catch (e) {
      log.error(logger, 'Failed merging geometries', e);
    }
  }

  return result;
};

/**
 * Normalizes a set of polygons and merges the result to avoid overlaps. Normalization is done within +/-
 * 180 degrees of the widest polygon in the set. Assumes polygon coordinates are currently in EPSG:4326.
 *
 * @param {Array<Polygon>} polygons The polygons.
 * @return {Array<Polygon>} The flattened polygon/multi-polygon.
 */
export const flattenPolygons = function(polygons) {
  if (polygons) {
    polygons = polygons.filter(filterFalsey);

    if (polygons.length > 1) {
      var normalizeExtent = [0, 0, 0, 0];
      for (var i = 0; i < polygons.length; i++) {
        var extent = polygons[i].getExtent();
        if (olExtent.getWidth(extent) > olExtent.getWidth(normalizeExtent)) {
          normalizeExtent = extent;
        }
      }

      var normalizeTo = (normalizeExtent[0] + normalizeExtent[2]) / 2;
      for (var i = 0; i < polygons.length; i++) {
        polygons[i].unset(GeometryField.NORMALIZED, true);
        normalizeGeometryCoordinates(polygons[i], normalizeTo, EPSG4326);
      }

      var merged = merge(polygons);
      if (merged instanceof Polygon) {
        return [merged];
      } else if (merged instanceof MultiPolygon) {
        return merged.getPolygons();
      }
    }
  }

  return polygons;
};

/**
 * Buffer a geometry. Uses different strategies depending on the geometry type and buffer distance.
 *
 * @param {Geometry} geometry The geometry.
 * @param {number} distance The buffer distance in meters.
 * @param {boolean=} opt_skipTransform If the lon/lat transform should be skipped.
 * @return {Geometry} The buffered geometry.
 */
export const buffer = function(geometry, distance, opt_skipTransform) {
  // abort now if a buffer won't be created
  if (!geometry) {
    return null;
  }

  var geomType = geometry.getType();
  if (distance == 0 || (geomType !== GeometryType.POINT && distance > TMERC_BUFFER_LIMIT)) {
    return null;
  }

  // avoid performing transformations on the original geometry
  var clone = geometry.clone();

  // buffer functions assume the geometry is in lon/lat, so transform the source geometry
  if (!opt_skipTransform) {
    clone.toLonLat();
  }

  var bufferGeom = null;
  switch (geomType) {
    case GeometryType.POINT:
      clone = /** @type {!Point} */ (clone);
      bufferGeom = bufferPoint_(clone, Math.abs(distance));
      break;
    case GeometryType.LINE_STRING:
    case GeometryType.MULTI_LINE_STRING:
      normalizeGeometryCoordinates(clone, undefined, EPSG4326);
      bufferGeom = splitAndBuffer_(clone, Math.abs(distance));
      break;
    case GeometryType.POLYGON:
      clone = /** @type {!Polygon} */ (clone);

      var coordinates = clone.getCoordinates();
      if (coordinates.length > 0 && geo.isPolarPolygon(coordinates[0])) {
        // handle polygons crossing EPSG:4326 poles by transforming to a polar projection
        bufferGeom = polarBuffer_(clone, distance);
      } else {
        //
        // determine the offset necessary to split the geometry.
        //  - zero offset means the geometry can be buffered without splitting
        //  - a positive value means the geometry can be split, buffered, and merged accurately
        //  - a negative value means the geometry cannot be accurately buffered with this approach
        //
        var extent = clone.getExtent();
        var splitOffset = getSplitOffset(extent, distance);
        if (!splitOffset) {
          var avgLon = (extent[0] + extent[2]) / 2;
          bufferGeom = tmercBuffer_(clone, distance, avgLon);
        } else if (splitOffset > 0) {
          bufferGeom = splitAndBuffer_(clone, distance);
        }
      }
      break;
    case GeometryType.MULTI_POLYGON:
      // buffer polygons individually, in case some are polar and some are not
      clone = /** @type {!MultiPolygon} */ (clone);

      var polygons = clone.getPolygons();

      // for inner buffers, normalize and combine source polygons where possible to avoid missing area within an overlap
      if (distance < 0) {
        polygons = flattenPolygons(polygons);
      }

      if (polygons) {
        var buffers = polygons.map(function(polygon) {
          return buffer(polygon, distance, true);
        }).filter(filterFalsey);

        // for outer buffers, flatten after buffering to prevent an overlapping (invalid) result
        if (distance > 0) {
          buffers = flattenPolygons(buffers);
        }

        // combine buffers into a single geometry
        bufferGeom = merge(buffers);
      }
      break;
    case GeometryType.GEOMETRY_COLLECTION:
      clone = /** @type {!GeometryCollection} */ (clone);

      var geometries = clone.getGeometries();
      if (geometries) {
        var buffers = geometries.map(function(g) {
          return buffer(g, distance, true);
        }).filter(filterFalsey);

        bufferGeom = merge(buffers);
      }
      break;
    default:
      break;
  }

  if (bufferGeom) {
    bufferGeom = validate(bufferGeom);

    // don't interpolate or normalize further
    bufferGeom.set(GeometryField.NORMALIZED, true);
    bufferGeom.set(METHOD_FIELD, Method.NONE);
  }

  // transform back to application projection
  if (bufferGeom && !opt_skipTransform) {
    bufferGeom.osTransform();
  }

  return bufferGeom;
};

/**
 * Buffer a point geometry.
 *
 * @param {!Point} point The point.
 * @param {number} distance The buffer distance in meters.
 * @return {Geometry} The buffered point.
 */
const bufferPoint_ = function(point, distance) {
  var start = point.getFirstCoordinate();
  var circle = geo.interpolateEllipse(start, distance, distance, 0);
  return new Polygon([circle]);
};

/**
 * Get the offset to use when splitting a geometry for buffering.
 *
 * @param {ol.Extent} extent The geometry's extent.
 * @param {number} distance The buffer distance.
 * @return {number} The offset between boxes to accurately buffer the geometry.
 */
export const getSplitOffset = function(extent, distance) {
  var boxWidth = UTM_WIDTH_DEGREES;
  if (extent && extent[2] - extent[0] > boxWidth) {
    if (distance < 0) {
      // negative buffer distances require reducing the offset as the geometry approaches the poles. this is due to
      // splitting the geometry in EPSG:4326, where the lateral distance approaches 0 near the poles.
      var absDistance = Math.abs(distance);
      var maxLat = Math.max(Math.abs(extent[1]), Math.abs(extent[3]));

      // determine the longitudinal offset using (2 * rhumb distance), with an additional buffer to correct minor
      // splits at corners
      var c1 = osasm.geodesicDirect([0, maxLat], 180, absDistance);
      var c2 = osasm.rhumbDirect([0, c1[1]], 90, absDistance * 2.05);
      var offset = UTM_WIDTH_DEGREES - c2[0];

      // return the offset if it's positive and will not exceed the split limit
      if (offset > 0 && (extent[2] - extent[0]) / offset <= UTM_SPLIT_LIMIT) {
        return offset;
      }

      // otherwise return -1 to indicate splitting cannot be performed
      return -1;
    } else {
      return boxWidth;
    }
  }

  // no need to split
  return 0;
};

/**
 * Create boxes to split a geometry.
 *
 * @param {Geometry} geometry The geometry to split.
 * @param {number} distance The buffer distance.
 * @return {Array<!jsts.geom.Polygon>|undefined}
 */
const getBoxesForExtent_ = function(geometry, distance) {
  var boxes;

  var extent = geometry.getExtent();
  var offset = getSplitOffset(extent, distance);
  if (offset >= 0) {
    boxes = [];

    // offset of 0 means no split is necessary, greater than 0 should be split
    if (offset > 0) {
      var olp = OLParser.getInstance();
      for (var i = extent[0]; i < extent[2]; i += offset) {
        var box = fromExtent([i, extent[1], i + UTM_WIDTH_DEGREES, extent[3]]);
        boxes.push(olp.read(box));
      }
    }
  }

  return boxes;
};

/**
 * Split a geometry by UTM zone, buffer, and join.
 *
 * @param {Geometry} geometry The geometry.
 * @param {number} distance The buffer distance in meters.
 * @return {Geometry} The buffered geometry.
 */
const splitAndBuffer_ = function(geometry, distance) {
  var buffered = null;

  // convert to a JSTS geometry
  var olp = OLParser.getInstance();
  var jstsGeometry = olp.read(geometry);

  var boxes = getBoxesForExtent_(geometry, distance);
  if (boxes && boxes.length < UTM_SPLIT_LIMIT) {
    var splitGeometries = [];
    if (boxes.length) {
      // split the geometry into equal width sections. this reduces error in buffer radius for larger geometries.
      for (var i = 0; i < boxes.length; i++) {
        var box = boxes[i];
        var intersection = jstsGeometry.intersection(box);
        if (!intersection.isEmpty()) {
          splitGeometries.push(olp.write(intersection));
        }
      }
    } else {
      // didn't need to split, so add the original geometry
      splitGeometries.push(geometry);
    }

    // buffer each of the split geometries
    if (splitGeometries.length > 0) {
      var extent = geometry.getExtent();
      var avgLon = (extent[0] + extent[2]) / 2;
      var buffers = [];
      for (var i = 0; i < splitGeometries.length; i++) {
        var buffer = tmercBuffer_(splitGeometries[i], distance, avgLon);
        if (buffer) {
          buffers.push(buffer);
        }
      }

      // merge the buffered geometries to create the final buffer region
      if (buffers.length > 0) {
        buffered = merge(buffers);
      }
    }
  }

  return buffered;
};

/**
 * Transform a geometry to transverse mercator, then create a buffer.
 *
 * @param {Geometry} geometry The geometry.
 * @param {number} distance The buffer distance in meters.
 * @param {number=} opt_normalizeLon Longitude to use for normalization.
 * @return {Geometry} The buffered geometry.
 */
const tmercBuffer_ = function(geometry, distance, opt_normalizeLon) {
  var buffer = null;

  if (geometry) {
    var projection = createTMercProjection_(geometry);
    buffer = projectionBuffer_(geometry, distance, projection, opt_normalizeLon);

    // clear the transform functions from the cache, since we're using a custom projection with a shared code
    var epsg4326 = getProjection(EPSG4326);
    if (getTransform(epsg4326, projection)) {
      removeTransform(epsg4326, projection);
    }
    if (getTransform(projection, epsg4326)) {
      removeTransform(projection, epsg4326);
    }
  }

  return buffer;
};

/**
 * Transform a geometry to a polar projection, then create a buffer.
 *
 * @param {Geometry} geometry The geometry.
 * @param {number} distance The buffer distance in meters.
 * @return {Geometry} The buffered geometry.
 */
const polarBuffer_ = function(geometry, distance) {
  var buffer = null;

  if (geometry) {
    var projection;
    var center = olExtent.getCenter(geometry.getExtent());
    if (center[1] > 0) {
      // use stereographic north projection
      projection = getProjection(EPSG3413);
    } else {
      // use stereographic south projection
      projection = getProjection(EPSG3031);
    }

    if (projection) {
      geometry.transform(EPSG4326, projection);
      buffer = projectionBuffer_(geometry, distance, projection);
    }
  }

  return buffer;
};

/**
 * Transform a geometry to transverse mercator, then create a buffer.
 *
 * @param {!Geometry} geometry The geometry.
 * @param {number} distance The buffer distance in meters.
 * @param {!Projection} projection The projection.
 * @param {number=} opt_normalizeLon Longitude to use for normalization.
 * @return {Geometry} The buffered geometry.
 */
const projectionBuffer_ = function(geometry, distance, projection, opt_normalizeLon) {
  var buffer = null;

  var olp = OLParser.getInstance();
  var jstsGeo = olp.read(geometry);
  if (jstsGeo) {
    // simplify the geometry within 1% of the target buffer distance. this significantly improves buffer performance,
    // and in testing introduced ~0.1% error to the buffer.
    var simplified = jsts.simplify.DouglasPeuckerSimplifier.simplify(jstsGeo, Math.abs(distance * 0.01));
    var jstsBuffer = simplified.buffer(distance);
    if (!jstsBuffer.isEmpty()) {
      buffer = olp.write(jstsBuffer);
      fromBufferProjection_(buffer, projection, opt_normalizeLon);
    }
  }

  return buffer;
};

/**
 * Transform the geometry to a projection for buffering.
 *
 * @param {!Geometry} geometry The geometry.
 * @return {!Projection} The projection.
 */
const createTMercProjection_ = function(geometry) {
  // create a transverse mercator projection with the origin at the center of the geometry's extent
  var origin = olExtent.getCenter(geometry.getExtent());
  proj4.defs('bufferCRS', '+ellps=WGS84 +proj=tmerc +lat_0=' + origin[1] + ' +lon_0=' + origin[0] +
      ' +k=1 +x_0=0 +y_0=0');

  var def = proj4.defs('bufferCRS');
  const code1 = EPSG4326;
  const code2 = 'bufferCRS';
  const units = def.units;
  const bufferProj = new Projection({code: code2, axisOrientation: def.axis, metersPerUnit: def.to_meter, units});
  addProjection(bufferProj);
  const transform = proj4(code1, code2);
  const proj1 = getProjection(code1);
  const proj2 = getProjection(code2);
  const safeTransform1 = createSafeCoordinateTransform(proj1, proj2, transform.forward);
  const safeTransform2 = createSafeCoordinateTransform(proj2, proj1, transform.inverse);
  addCoordinateTransforms(proj1, proj2, safeTransform1, safeTransform2);

  var projection = new Projection({code: 'bufferCRS'});
  geometry.transform(EPSG4326, projection);

  return projection;
};

/**
 * Transform the geometry from a projection for buffering.
 *
 * @param {Geometry} geometry The geometry.
 * @param {!Projection} projection The projection.
 * @param {number=} opt_normalizeLon Longitude to use for normalization.
 */
const fromBufferProjection_ = function(geometry, projection, opt_normalizeLon) {
  if (geometry) {
    geometry.transform(projection, EPSG4326);
    normalizeGeometryCoordinates(geometry, opt_normalizeLon, EPSG4326);
  }
};

/**
 * Get / create a valid version of the geometry given. If the geometry is a polygon or multi polygon, self intersections /
 * inconsistencies are fixed. Otherwise the geometry is returned.
 *
 * @param {Geometry|undefined} geometry The geometry to validate.
 * @param {boolean=} opt_quiet If alerts should be suppressed.
 * @param {boolean=} opt_undefinedIfInvalid returns undefined if the geometry is invalid
 * @return {Geometry|undefined} The validated geometry, or the input geometry if it could not be validated.
 *
 * @see https://stackoverflow.com/questions/31473553
 */
export const validate = function(geometry, opt_quiet, opt_undefinedIfInvalid) {
  if (!geometry) {
    return undefined;
  }

  var geomType = geometry.getType();
  if (geomType == GeometryType.POLYGON || geomType == GeometryType.MULTI_POLYGON) {
    try {
      var olp = OLParser.getInstance();
      var jstsPoly = olp.read(geometry);

      // check for empty first because JSTS will throw an error when calling isValid on an empty polygon
      if (jstsPoly.isEmpty()) {
        return opt_undefinedIfInvalid ? undefined : geometry;
      }

      var jstsValidPoly;
      if (jstsPoly.isValid()) {
        // if the polygon is already valid, just normalize it. validate does not pick up rings in the wrong order, but
        // normalization will fix that.
        jstsPoly.normalize();
        jstsValidPoly = jstsPoly;
      } else if (jstsPoly instanceof jsts.geom.Polygon) {
        jstsValidPoly = polygonize(jstsPoly);
      } else if (jstsPoly instanceof jsts.geom.MultiPolygon) {
        var polygonizer = new jsts.operation.polygonize.Polygonizer();
        for (var n = jstsPoly.getNumGeometries(); n-- > 0;) {
          addPolygon(jstsPoly.getGeometryN(n), polygonizer);
        }
        jstsValidPoly = toPolygonGeometry(polygonizer.getPolygons(), jstsPoly.getFactory());

        if (jstsValidPoly === null) {
          // Retry polygonizer with the union of everything inside the MultiPolygon
          jstsValidPoly = polygonize(/** @type {jsts.geom.Polygon} */ (jstsPoly.union()));
        }
      }

      if (jstsValidPoly && jstsValidPoly.isValid()) {
        // if the polygon perimeter changes by more than 0.5%, warn the user that the area changed but still allow
        // them to use it
        var oldLength = jstsPoly.getLength();
        var diff = Math.abs(oldLength - jstsValidPoly.getLength());
        if (!opt_quiet && diff / oldLength > 0.005) {
          AlertManager.getInstance().sendAlert('Area was modified from the original due to invalid topology. Common ' +
              'reasons include polygons that cross or overlap themselves.',
          AlertEventSeverity.WARNING);
        }

        // return the validated geometry with properties copied from the original
        var validGeometry = olp.write(jstsValidPoly);
        validGeometry.setProperties(geometry.getProperties());
        return validGeometry;
      }
    } catch (e) {
      log.error(logger, 'Geometry validation check failed', e);
    }
  }

  // default to returning undefined
  return opt_undefinedIfInvalid ? undefined : geometry;
};

/**
 * Polygonize helper for a single polygon geometry.
 * Creates a Polygonizer and attempts to generate a valid a polygon from the input.
 *
 * @param {jsts.geom.Polygon} polygon to validate
 * @return {jsts.geom.Polygon|jsts.geom.MultiPolygon} null if there were no polygons, the polygon if there was only one,
 *                                                     or a MultiPolygon containing all polygons otherwise.
 */
export const polygonize = function(polygon) {
  var polygonizer = new jsts.operation.polygonize.Polygonizer();
  addPolygon(polygon, polygonizer);
  return toPolygonGeometry(polygonizer.getPolygons(), polygon.getFactory());
};

/**
 * Add all line strings from the polygon given to the polygonizer given
 *
 * @param {jsts.geom.Polygon} polygon from which to extract line strings
 * @param {jsts.operation.polygonize.Polygonizer} polygonizer The polygonizer.
 *
 * @see https://stackoverflow.com/questions/31473553
 */
export const addPolygon = function(polygon, polygonizer) {
  addLineString(polygon.getExteriorRing(), polygonizer);

  for (var n = polygon.getNumInteriorRing(); n-- > 0;) {
    addLineString(polygon.getInteriorRingN(n), polygonizer);
  }
};

/**
 * Add the linestring given to the polygonizer
 *
 * @param {jsts.geom.LineString} lineString The line string.
 * @param {jsts.operation.polygonize.Polygonizer} polygonizer
 *
 * @see https://stackoverflow.com/questions/31473553
 */
export const addLineString = function(lineString, polygonizer) {
  // LinearRings are treated differently to line strings : we need a LineString NOT a LinearRing
  if (lineString instanceof jsts.geom.LinearRing) {
    lineString = lineString.getFactory().createLineString(lineString.getCoordinates());
  }

  // unioning the linestring with the point makes any self intersections explicit.
  var point = lineString.getFactory().createPoint(lineString.getCoordinateN(0));
  var toAdd = lineString.union(point);

  // Add result to polygonizer
  polygonizer.add(toAdd);
};

/**
 * Get a geometry from a collection of polygons.
 *
 * @param {jsts.Collection<jsts.geom.Polygon>} polygons Polygons collection
 * @param {jsts.geom.GeometryFactory} factory Factory to generate MultiPolygon if required
 * @return {jsts.geom.Polygon|jsts.geom.MultiPolygon} null if there were no polygons, the polygon if there was only one,
 *                                                    or a MultiPolygon containing all polygons otherwise.
 * @see https://stackoverflow.com/questions/31473553
 */
export const toPolygonGeometry = function(polygons, factory) {
  switch (polygons.size()) {
    case 0:
      // no valid polygons
      return null;
    case 1:
      // single polygon - no need to combine
      return polygons.iterator().next();
    default:
      // polygons may still overlap! compute the union to determine the final polygon.
      var iter = polygons.iterator();
      var ret = iter.next();
      while (iter.hasNext()) {
        ret = ret.union(iter.next());
      }
      return ret;
  }
};

/**
 * Finds the two nearest points between two geometries and returns them in an ordered array.
 *
 * @param {Geometry} geom1 The first geometry.
 * @param {Geometry} geom2 The second geometry.
 * @return {Array<ol.Coordinate>} The ordered list of point coordinates, the first one being the nearest point
 *                                on geom1, the second the nearest point on geom2.
 */
export const nearestPoints = function(geom1, geom2) {
  var jstsParser = OLParser.getInstance();
  var jstsGeom1 = jstsParser.read(geom1);
  var jsts2Geom2 = jstsParser.read(geom2);
  var jstsCoords = jsts.operation.distance.DistanceOp.nearestPoints(jstsGeom1, jsts2Geom2);

  return jstsCoords.map(jstsCoordToOlCoord);
};

/**
 * Maps a JSTS coordinate to an OL coordinate.
 *
 * @param {jsts.geom.Coordinate} jstsCoord The JSTS coordinate.
 * @return {ol.Coordinate} The OL coordinate.
 */
export const jstsCoordToOlCoord = function(jstsCoord) {
  return [jstsCoord.x, jstsCoord.y, jstsCoord.z];
};

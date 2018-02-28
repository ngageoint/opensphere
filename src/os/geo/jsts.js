/**
 * @license
 * Copyright (c) 2011 by The Authors.
 * Published under the LGPL 2.1 license.
 * See /license-notice.txt for the full text of the license notice.
 * See /license.txt for the full text of the license.
 */
goog.provide('os.geo.jsts');
goog.provide('os.geo.jsts.OLParser');

goog.require('goog.log');
goog.require('ol.Feature');
goog.require('ol.extent');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('ol.geom.LinearRing');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPoint');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.proj.Projection');
goog.require('os.fn');
goog.require('os.geo');
goog.require('os.geom.GeometryField');
goog.require('os.map');
goog.require('os.mixin.jsts');
goog.require('os.proj');


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.geo.jsts.LOGGER_ = goog.log.getLogger('os.geo.jsts');


/**
 * @enum {string}
 */
os.geo.jsts.ErrorMessage = {
  NO_OP: 'Result geometry is unchanged',
  EMPTY: 'Result geometry is empty'
};


/**
 * Regular expression for geometries that should use an absolute value as the buffer distance.
 * @type {RegExp}
 */
os.geo.jsts.ABS_BUFFER_REGEX = /(point|linestring)/i;


/**
 * Regular expression for line string geometries.
 * @type {RegExp}
 */
os.geo.jsts.LINE_REGEX = /linestring/i;


/**
 * Regular expression for polygonal geometries.
 * @type {RegExp}
 */
os.geo.jsts.POLYGON_REGEX = /polygon/i;


/**
 * Width of a UTM zone in degrees.
 *
 * WARNING: If this is changed: TMERC_BUFFER_LIMIT will need to be recalculated by calling
 * <code>osasm.geodesicInverse([0, 0], [0, UTM_WIDTH_DEGREES]).distance;</code>
 *
 * That library is only available asynchronously on startup and so we can't do that here.
 *
 * @type {number}
 * @const
 */
os.geo.jsts.UTM_WIDTH_DEGREES = 6;


/**
 * Maximum number of splits to perform on a geometry when buffering. This is only necessary when performing an inverse
 * buffer, where split zones need to be overlapped.
 * @type {number}
 * @const
 */
os.geo.jsts.UTM_SPLIT_LIMIT = 500;


/**
 * Buffer radius limit for Transverse Mercator projections before accuracy drops below 0.5%.
 *
 * WARNING: If UTM_WIDTH_DEGREES is changed: TMERC_BUFFER_LIMIT will need to be recalculated by calling
 * <code>osasm.geodesicInverse([0, 0], [0, UTM_WIDTH_DEGREES]).distance;</code>
 *
 * That library is only available asynchronously on startup and so we can't do that here.
 *
 * @type {number}
 * @const
 */
os.geo.jsts.TMERC_BUFFER_LIMIT = 663469.9375;


/**
 * Convert a {@link jsts.geom.Coordinate} coordinate to an {@link ol.Coordinate}.
 * @param {jsts.geom.Coordinate} coord The JSTS coordinate
 * @return {ol.Coordinate} An OL3 coordinate
 */
os.geo.jsts.convertToCoordinate = function(coord) {
  var olCoord = null;
  if (coord) {
    olCoord = [coord.x, coord.y];
    if (coord.z != null) {
      olCoord.push(coord.z);
    }
  }

  return olCoord;
};


/**
 * Convert an {@link ol.Coordinate} to a {@link jsts.geom.Coordinate}.
 * @param {ol.Coordinate} coord The OL3 coordinate
 * @return {jsts.geom.Coordinate} A JSTS coordinate
 */
os.geo.jsts.convertFromCoordinate = function(coord) {
  return new jsts.geom.Coordinate(coord[0], coord[1], coord[2]);
};


/**
 * Utility class to translate between OL3 and JSTS geometries. This was copied from JSTS so the instanceof calls would
 * still work with compiled code.
 * @param {jsts.geom.GeometryFactory=} opt_geometryFactory
 * @constructor
 */
os.geo.jsts.OLParser = function(opt_geometryFactory) {
  if (window['jsts'] == null) {
    throw new Error('JSTS library is not loaded!');
  }

  this.geometryFactory = opt_geometryFactory || new jsts.geom.GeometryFactory();
};
goog.addSingletonGetter(os.geo.jsts.OLParser);


/**
 * @param {ol.geom.Geometry} geometry
 * @return {jsts.geom.Geometry}
 */
os.geo.jsts.OLParser.prototype.read = function(geometry) {
  if (geometry) {
    var type = geometry.getType();
    switch (type) {
      case ol.geom.GeometryType.POINT:
        return this.convertFromPoint(/** @type {ol.geom.Point} */ (geometry));
      case ol.geom.GeometryType.LINE_STRING:
        return this.convertFromLineString(/** @type {ol.geom.LineString} */ (geometry));
      case ol.geom.GeometryType.LINEAR_RING:
        return this.convertFromLinearRing(/** @type {ol.geom.LinearRing} */ (geometry));
      case ol.geom.GeometryType.POLYGON:
        return this.convertFromPolygon(/** @type {ol.geom.Polygon} */ (geometry));
      case ol.geom.GeometryType.MULTI_POINT:
        return this.convertFromMultiPoint(/** @type {ol.geom.MultiPoint} */ (geometry));
      case ol.geom.GeometryType.MULTI_LINE_STRING:
        return this.convertFromMultiLineString(/** @type {ol.geom.MultiLineString} */ (geometry));
      case ol.geom.GeometryType.MULTI_POLYGON:
        return this.convertFromMultiPolygon(/** @type {ol.geom.MultiPolygon} */ (geometry));
      case ol.geom.GeometryType.GEOMETRY_COLLECTION:
        return this.convertFromCollection(/** @type {ol.geom.GeometryCollection} */ (geometry));
      default:
        break;
    }
  }

  return null;
};


/**
 * @param {ol.geom.Point} point
 * @return {jsts.geom.Point}
 */
os.geo.jsts.OLParser.prototype.convertFromPoint = function(point) {
  var coord = point.getCoordinates();
  return this.geometryFactory.createPoint(os.geo.jsts.convertFromCoordinate(coord));
};


/**
 * @param {ol.geom.LineString} lineString
 * @return {jsts.geom.LineString}
 */
os.geo.jsts.OLParser.prototype.convertFromLineString = function(lineString) {
  // JSTS doesn't allow null/empty coordinates, so don't create a geometry
  var coordinates = lineString.getCoordinates();
  if (!coordinates || coordinates.length == 0) {
    return null;
  }

  // JSTS will throw an error if there is only one coordinate, so duplicate the coordinate
  if (coordinates.length == 1) {
    coordinates[1] = coordinates[0];
  }

  return this.geometryFactory.createLineString(coordinates.map(os.geo.jsts.convertFromCoordinate));
};


/**
 * @param {ol.geom.LinearRing} linearRing
 * @return {jsts.geom.LinearRing}
 */
os.geo.jsts.OLParser.prototype.convertFromLinearRing = function(linearRing) {
  return this.geometryFactory.createLinearRing(linearRing.getCoordinates().map(os.geo.jsts.convertFromCoordinate));
};


/**
 * @param {ol.geom.Polygon} polygon
 * @return {jsts.geom.Polygon}
 */
os.geo.jsts.OLParser.prototype.convertFromPolygon = function(polygon) {
  var linearRings = polygon.getLinearRings();
  var shell = null;
  var holes = [];
  for (var i = 0; i < linearRings.length; i++) {
    var linearRing = this.convertFromLinearRing(linearRings[i]);
    if (i === 0) {
      shell = linearRing;
    } else {
      holes.push(linearRing);
    }
  }
  return this.geometryFactory.createPolygon(shell, holes);
};


/**
 * @param {ol.geom.MultiPoint} multiPoint
 * @return {jsts.geom.MultiPoint}
 */
os.geo.jsts.OLParser.prototype.convertFromMultiPoint = function(multiPoint) {
  var points = multiPoint.getPoints().map(function(point) {
    return this.convertFromPoint(point);
  }, this);
  return this.geometryFactory.createMultiPoint(points);
};


/**
 * @param {ol.geom.MultiLineString} multiLineString
 * @return {jsts.geom.MultiLineString}
 */
os.geo.jsts.OLParser.prototype.convertFromMultiLineString = function(multiLineString) {
  var lineStrings = multiLineString.getLineStrings().map(function(lineString) {
    return this.convertFromLineString(lineString);
  }, this);
  return this.geometryFactory.createMultiLineString(lineStrings);
};


/**
 * @param {ol.geom.MultiPolygon} multiPolygon
 * @return {jsts.geom.MultiPolygon}
 */
os.geo.jsts.OLParser.prototype.convertFromMultiPolygon = function(multiPolygon) {
  var polygons = multiPolygon.getPolygons().map(function(polygon) {
    return this.convertFromPolygon(polygon);
  }, this);
  return this.geometryFactory.createMultiPolygon(polygons);
};


/**
 * @param {ol.geom.GeometryCollection} collection
 * @return {jsts.geom.GeometryCollection}
 */
os.geo.jsts.OLParser.prototype.convertFromCollection = function(collection) {
  var geometries = collection.getGeometries().map(function(geometry) {
    return this.read(geometry);
  }, this);
  return this.geometryFactory.createGeometryCollection(geometries);
};


/**
 * @param {jsts.geom.Geometry} geometry
 * @return {ol.geom.Geometry}
 */
os.geo.jsts.OLParser.prototype.write = function(geometry) {
  var type = geometry.getGeometryType();
  if (type === 'Point') {
    return this.convertToPoint(/** @type {!jsts.geom.Point} */ (geometry).getCoordinate());
  } else if (type === 'LineString') {
    return this.convertToLineString(/** @type {!jsts.geom.LineString} */ (geometry));
  } else if (type === 'LinearRing') {
    return this.convertToLinearRing(/** @type {!jsts.geom.LinearRing} */ (geometry));
  } else if (type === 'Polygon') {
    return this.convertToPolygon(/** @type {!jsts.geom.Polygon} */ (geometry));
  } else if (type === 'MultiPoint') {
    return this.convertToMultiPoint(/** @type {!jsts.geom.MultiPoint} */ (geometry));
  } else if (type === 'MultiLineString') {
    return this.convertToMultiLineString(/** @type {!jsts.geom.MultiLineString} */ (geometry));
  } else if (type === 'MultiPolygon') {
    return this.convertToMultiPolygon(/** @type {!jsts.geom.MultiPolygon} */ (geometry));
  } else if (type === 'GeometryCollection') {
    return this.convertToCollection(/** @type {!jsts.geom.GeometryCollection} */ (geometry));
  }

  return null;
};


/**
 * @param {jsts.geom.Coordinate} coordinate
 * @return {!ol.geom.Point}
 */
os.geo.jsts.OLParser.prototype.convertToPoint = function(coordinate) {
  return new ol.geom.Point(os.geo.jsts.convertToCoordinate(coordinate));
};


/**
 * @param {jsts.geom.LineString} lineString
 * @return {!ol.geom.LineString}
 */
os.geo.jsts.OLParser.prototype.convertToLineString = function(lineString) {
  var points = lineString ? lineString.getCoordinates().map(os.geo.jsts.convertToCoordinate) : [];
  return new ol.geom.LineString(points);
};


/**
 * @param {jsts.geom.LinearRing} linearRing
 * @return {!ol.geom.LinearRing}
 */
os.geo.jsts.OLParser.prototype.convertToLinearRing = function(linearRing) {
  var points = linearRing ? linearRing.getCoordinates().map(os.geo.jsts.convertToCoordinate) : [];
  return new ol.geom.LinearRing(points);
};


/**
 * @param {jsts.geom.Polygon} polygon
 * @return {!ol.geom.Polygon}
 */
os.geo.jsts.OLParser.prototype.convertToPolygon = function(polygon) {
  var rings = [];
  if (polygon) {
    var exterior = polygon.getExteriorRing();
    if (exterior) {
      rings.push(exterior.getCoordinates().map(os.geo.jsts.convertToCoordinate));

      var nInteriorRings = polygon.getNumInteriorRing();
      for (var i = 0; i < nInteriorRings; i++) {
        var interiorRing = polygon.getInteriorRingN(i);
        if (interiorRing) {
          rings.push(interiorRing.getCoordinates().map(os.geo.jsts.convertToCoordinate));
        }
      }
    }
  }

  return new ol.geom.Polygon(rings);
};


/**
 * @param {jsts.geom.MultiPoint} multiPoint
 * @return {!ol.geom.MultiPoint}
 */
os.geo.jsts.OLParser.prototype.convertToMultiPoint = function(multiPoint) {
  var points = multiPoint ? multiPoint.getCoordinates().map(os.geo.jsts.convertToCoordinate) : [];
  return new ol.geom.MultiPoint(points);
};


/**
 * @param {jsts.geom.MultiLineString} multiLineString
 * @return {!ol.geom.MultiLineString}
 */
os.geo.jsts.OLParser.prototype.convertToMultiLineString = function(multiLineString) {
  var lineStrings = [];
  if (multiLineString) {
    var nGeometries = multiLineString.getNumGeometries();
    for (var i = 0; i < nGeometries; i++) {
      var lineString = multiLineString.getGeometryN(i);
      if (lineString) {
        lineStrings.push(this.convertToLineString(lineString).getCoordinates());
      }
    }
  }

  return new ol.geom.MultiLineString(lineStrings);
};


/**
 * @param {jsts.geom.MultiPolygon} multiPolygon
 * @return {!ol.geom.MultiPolygon}
 */
os.geo.jsts.OLParser.prototype.convertToMultiPolygon = function(multiPolygon) {
  var polygons = [];
  if (multiPolygon) {
    var nGeometries = multiPolygon.getNumGeometries();
    for (var i = 0; i < nGeometries; i++) {
      var polygon = multiPolygon.getGeometryN(i);
      if (polygon) {
        polygons.push(this.convertToPolygon(polygon).getCoordinates());
      }
    }
  }

  return new ol.geom.MultiPolygon(polygons);
};


/**
 * @param {jsts.geom.GeometryCollection} geometryCollection
 * @return {!ol.geom.GeometryCollection}
 */
os.geo.jsts.OLParser.prototype.convertToCollection = function(geometryCollection) {
  var geometries = [];
  if (geometryCollection) {
    var nGeometries = geometryCollection.getNumGeometries();
    for (var i = 0; i < nGeometries; i++) {
      var geometry = geometryCollection.getGeometryN(i);
      if (geometry) {
        geometries.push(this.write(geometry));
      }
    }
  }

  return new ol.geom.GeometryCollection(geometries);
};


/**
 * Converts an ol.geom.Geometry to an ol.geom.Polygon or ol.geom.MultiPolygon, if possible.
 * @param {ol.geom.Geometry} geometry The geometry to convert
 * @return {ol.geom.Geometry}
 */
os.geo.jsts.toPolygon = function(geometry) {
  var polygon = null;

  if (geometry) {
    var geomType = geometry.getType();
    switch (geomType) {
      case ol.geom.GeometryType.LINE_STRING:
        // line strings must have at least 4 coordinates and form a closed loop
        var coords = /** @type {!ol.geom.LineString} */ (geometry).getCoordinates();
        if (coords.length > 3 && os.geo.isClosed(coords)) {
          // convert closed lines to a polygon
          polygon = new ol.geom.Polygon([coords]);
        }
        break;
      case ol.geom.GeometryType.MULTI_LINE_STRING:
        // MultiLineString applies the same rules as LineString to each line
        var coords = /** @type {!ol.geom.MultiLineString} */ (geometry).getCoordinates();
        var closedCoords = [];
        for (var i = 0; i < coords.length; i++) {
          if (coords[i].length > 3 && os.geo.isClosed(coords[i])) {
            // only include closed internal lines. others will be discarded.
            closedCoords.push(coords[i]);
          }
        }

        if (closedCoords.length == 1) {
          // one closed line = polygon
          polygon = new ol.geom.Polygon(closedCoords);
        } else if (closedCoords.length > 1) {
          // multiple closed lines = multipolygon
          polygon = new ol.geom.MultiPolygon([closedCoords]);
        }
        break;
      case ol.geom.GeometryType.CIRCLE:
        // OL3 has a direct conversion - woo!
        polygon = ol.geom.Polygon.fromCircle(/** @type {!ol.geom.Circle} */ (geometry), 64);
        break;
      case ol.geom.GeometryType.GEOMETRY_COLLECTION:
        // convert each internal geometry and merge the results
        var geometries = /** @type {!ol.geom.GeometryCollection} */ (geometry).getGeometriesArray();
        if (geometries) {
          var polygons = [];
          for (var i = 0; i < geometries.length; i++) {
            var current = os.geo.jsts.toPolygon(geometries[i]);
            if (current) {
              var currType = current.getType();
              if (currType == ol.geom.GeometryType.POLYGON) {
                polygons.push(current);
              } else if (currType == ol.geom.GeometryType.MULTI_POLYGON) {
                /** @type {!ol.geom.MultiPolygon} */ (current).getPolygons().forEach(function(poly) {
                  polygons.push(poly);
                });
              }
            }
          }

          if (polygons.length == 1) {
            polygon = polygons[0];
          } else if (polygons.length > 1) {
            polygon = new ol.geom.MultiPolygon(null);
            polygon.setPolygons(polygons);
          }
        }
        break;
      case ol.geom.GeometryType.POLYGON:
      case ol.geom.GeometryType.MULTI_POLYGON:
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
 * @param {ol.Feature} source The feature with the geometry to add to
 * @param {ol.Feature} target The feature with the geometry to add
 * @param {boolean=} opt_replace If the source feature's geometry should be replaced, or a new feature created
 *
 * @return {ol.Feature} The feature with the new geometry
 * @throws {Error} If the add does nothing
 */
os.geo.jsts.addTo = function(source, target, opt_replace) {
  var feature = null;
  if (source && target) {
    var geometry = source.getGeometry();
    var targetGeometry = target.getGeometry();

    if (geometry && targetGeometry) {
      var olp = os.geo.jsts.OLParser.getInstance();
      var srcJsts = olp.read(geometry);
      var targetJsts = olp.read(targetGeometry);

      if (!srcJsts.covers(targetJsts)) {
        var jstsGeom = srcJsts.union(targetJsts);
        var newGeometry = olp.write(jstsGeom);
        if (newGeometry) {
          newGeometry = os.geo.jsts.validate(newGeometry);
          newGeometry.set(os.geom.GeometryField.NORMALIZED, true);
        }

        feature = opt_replace ? source : new ol.Feature();
        feature.setGeometry(newGeometry);
      } else {
        throw new Error(os.geo.jsts.ErrorMessage.NO_OP);
      }
    }
  }

  return feature;
};


/**
 * Removes the target geometry from the source geometry.
 *
 * @param {ol.Feature} source The feature with the geometry to remove from.
 * @param {ol.Feature} target The feature with the geometry to remove.
 * @param {boolean=} opt_replace If the source feature's geometry should be replaced, or a new feature created
 *
 * @return {ol.Feature} The feature with the new geometry
 * @throws {Error} If the remove creates an empty geometry or does nothing
 */
os.geo.jsts.removeFrom = function(source, target, opt_replace) {
  var feature = null;
  if (source && target) {
    var geometry = source.getGeometry();
    var targetGeometry = target.getGeometry();

    if (geometry && targetGeometry) {
      var olp = os.geo.jsts.OLParser.getInstance();
      var srcJsts = olp.read(geometry);
      var targetJsts = olp.read(targetGeometry);

      feature = opt_replace ? source : new ol.Feature();

      if (targetJsts.covers(srcJsts)) {
        // if the target geometry covers the source, the result will be empty
        throw new Error(os.geo.jsts.ErrorMessage.EMPTY);
      } else if (srcJsts.contains(targetJsts) || srcJsts.crosses(targetJsts) || srcJsts.overlaps(targetJsts)) {
        var jstsGeom = srcJsts.difference(targetJsts);
        if (jstsGeom && !jstsGeom.isEmpty()) {
          var newGeometry = olp.write(jstsGeom);
          if (newGeometry) {
            newGeometry = os.geo.jsts.validate(newGeometry);
            newGeometry.set(os.geom.GeometryField.NORMALIZED, true);
          }

          feature.setGeometry(newGeometry);
        } else {
          // result was empty, so flag as such on the feature and don't change the geometry
          throw new Error(os.geo.jsts.ErrorMessage.EMPTY);
        }
      } else {
        throw new Error(os.geo.jsts.ErrorMessage.NO_OP);
      }
    }
  }

  return feature;
};


/**
 * Computes the intersection of two geometries.
 *
 * @param {ol.Feature} source The first feature to intersect
 * @param {ol.Feature} target The second feature to intersect
 * @param {boolean=} opt_replace If the source feature's geometry should be replaced, or a new feature created
 *
 * @return {ol.Feature} The feature with the new geometry
 * @throws {Error} If the remove creates an empty geometry or does nothing
 */
os.geo.jsts.intersect = function(source, target, opt_replace) {
  var feature = null;
  if (source && target) {
    var geometry = source.getGeometry();
    var targetGeometry = target.getGeometry();

    if (geometry && targetGeometry) {
      var olp = os.geo.jsts.OLParser.getInstance();
      var srcJsts = olp.read(geometry);
      var targetJsts = olp.read(targetGeometry);

      feature = opt_replace ? source : new ol.Feature();

      if (!targetJsts.intersects(srcJsts)) {
        // if the target geometry doesn't intersect the source, the result will be empty
        throw new Error(os.geo.jsts.ErrorMessage.EMPTY);
      } else {
        var jstsGeom = srcJsts.intersection(targetJsts);
        if (jstsGeom && !jstsGeom.isEmpty()) {
          var newGeometry = olp.write(jstsGeom);
          if (newGeometry) {
            newGeometry = os.geo.jsts.validate(newGeometry);
            newGeometry.set(os.geom.GeometryField.NORMALIZED, true);
          }

          feature.setGeometry(newGeometry);
        } else {
          // result was empty, so flag as such on the feature and don't change the geometry
          throw new Error(os.geo.jsts.ErrorMessage.EMPTY);
        }
      }
    }
  }

  return feature;
};


/**
 * Merges a list of geometries into a single geometry.
 * @param {Array<ol.geom.Geometry>} geometries The geometries.
 * @return {ol.geom.Geometry} The merged geometry.
 */
os.geo.jsts.merge = function(geometries) {
  var result = null;
  if (geometries) {
    try {
      var olp = os.geo.jsts.OLParser.getInstance();
      var polys = geometries.map(function(geometry) {
        // convert all OL3 geometries to JSTS
        return geometry ? olp.read(geometry) : null;
      }).filter(os.fn.filterFalsey);

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
      goog.log.error(os.geo.jsts.LOGGER_, 'Failed merging geometries', e);
    }
  }

  return result;
};


/**
 * Normalizes a set of polygons and merges the result to avoid overlaps. Normalization is done within +/-
 * 180 degrees of the widest polygon in the set. Assumes polygon coordinates are currently in EPSG:4326.
 * @param {Array<ol.geom.Polygon>} polygons The polygons.
 * @return {Array<ol.geom.Polygon>} The flattened polygon/multi-polygon.
 */
os.geo.jsts.flattenPolygons = function(polygons) {
  if (polygons) {
    polygons = polygons.filter(os.fn.filterFalsey);

    if (polygons.length > 1) {
      var normalizeExtent = [0, 0, 0, 0];
      for (var i = 0; i < polygons.length; i++) {
        var extent = polygons[i].getExtent();
        if (ol.extent.getWidth(extent) > ol.extent.getWidth(normalizeExtent)) {
          normalizeExtent = extent;
        }
      }

      var normalizeTo = (normalizeExtent[0] + normalizeExtent[2]) / 2;
      for (var i = 0; i < polygons.length; i++) {
        polygons[i].unset(os.geom.GeometryField.NORMALIZED, true);
        os.geo.normalizeGeometryCoordinates(polygons[i], normalizeTo);
      }

      var merged = os.geo.jsts.merge(polygons);
      if (merged instanceof ol.geom.Polygon) {
        return [merged];
      } else if (merged instanceof ol.geom.MultiPolygon) {
        return merged.getPolygons();
      }
    }
  }

  return polygons;
};


/**
 * Buffer a geometry. Uses different strategies depending on the geometry type and buffer distance.
 * @param {ol.geom.Geometry} geometry The geometry.
 * @param {number} distance The buffer distance in meters.
 * @param {boolean=} opt_skipTransform If the lon/lat transform should be skipped.
 * @return {ol.geom.Geometry} The buffered geometry.
 */
os.geo.jsts.buffer = function(geometry, distance, opt_skipTransform) {
  // abort now if a buffer won't be created
  if (!geometry) {
    return null;
  }

  var geomType = geometry.getType();
  if (distance == 0 || (geomType !== ol.geom.GeometryType.POINT && distance > os.geo.jsts.TMERC_BUFFER_LIMIT)) {
    return null;
  }

  // avoid performing transformations on the original geometry
  var clone = geometry.clone();

  // buffer functions assume the geometry is in lon/lat, so transform the source geometry
  if (!opt_skipTransform) {
    clone.toLonLat();
  }

  var buffer = null;
  switch (geomType) {
    case ol.geom.GeometryType.POINT:
      clone = /** @type {!ol.geom.Point} */ (clone);
      buffer = os.geo.jsts.bufferPoint_(clone, Math.abs(distance));
      break;
    case ol.geom.GeometryType.LINE_STRING:
    case ol.geom.GeometryType.MULTI_LINE_STRING:
      os.geo.normalizeGeometryCoordinates(clone);
      buffer = os.geo.jsts.splitAndBuffer_(clone, Math.abs(distance));
      break;
    case ol.geom.GeometryType.POLYGON:
      clone = /** @type {!ol.geom.Polygon} */ (clone);

      var coordinates = clone.getCoordinates();
      if (coordinates.length > 0 && os.geo.isPolarPolygon(coordinates[0])) {
        // handle polygons crossing EPSG:4326 poles by transforming to a polar projection
        buffer = os.geo.jsts.polarBuffer_(clone, distance);
      } else {
        //
        // determine the offset necessary to split the geometry.
        //  - zero offset means the geometry can be buffered without splitting
        //  - a positive value means the geometry can be split, buffered, and merged accurately
        //  - a negative value means the geometry cannot be accurately buffered with this approach
        //
        var extent = clone.getExtent();
        var splitOffset = os.geo.jsts.getSplitOffset(extent, distance);
        if (!splitOffset) {
          var avgLon = (extent[0] + extent[2]) / 2;
          buffer = os.geo.jsts.tmercBuffer_(clone, distance, avgLon);
        } else if (splitOffset > 0) {
          buffer = os.geo.jsts.splitAndBuffer_(clone, distance);
        }
      }
      break;
    case ol.geom.GeometryType.MULTI_POLYGON:
      // buffer polygons individually, in case some are polar and some are not
      clone = /** @type {!ol.geom.MultiPolygon} */ (clone);

      var polygons = clone.getPolygons();

      // for inner buffers, normalize and combine source polygons where possible to avoid missing area within an overlap
      if (distance < 0) {
        polygons = os.geo.jsts.flattenPolygons(polygons);
      }

      if (polygons) {
        var buffers = polygons.map(function(polygon) {
          return os.geo.jsts.buffer(polygon, distance, true);
        }).filter(os.fn.filterFalsey);

        // for outer buffers, flatten after buffering to prevent an overlapping (invalid) result
        if (distance > 0) {
          buffers = os.geo.jsts.flattenPolygons(buffers);
        }

        // combine buffers into a single geometry
        buffer = os.geo.jsts.merge(buffers);
      }
      break;
    case ol.geom.GeometryType.GEOMETRY_COLLECTION:
      clone = /** @type {!ol.geom.GeometryCollection} */ (clone);

      var geometries = clone.getGeometries();
      if (geometries) {
        var buffers = geometries.map(function(g) {
          return os.geo.jsts.buffer(g, distance, true);
        }).filter(os.fn.filterFalsey);

        buffer = os.geo.jsts.merge(buffers);
      }
      break;
    default:
      break;
  }

  if (buffer) {
    buffer = os.geo.jsts.validate(buffer);

    // don't interpolate or normalize further
    buffer.set(os.geom.GeometryField.NORMALIZED, true);
    buffer.set(os.interpolate.METHOD_FIELD, os.interpolate.Method.NONE);
  }

  // transform back to application projection
  if (buffer && !opt_skipTransform) {
    buffer.osTransform();
  }

  return buffer;
};


/**
 * Buffer a point geometry.
 * @param {!ol.geom.Point} point The point.
 * @param {number} distance The buffer distance in meters.
 * @return {ol.geom.Geometry} The buffered point.
 * @private
 */
os.geo.jsts.bufferPoint_ = function(point, distance) {
  var start = point.getFirstCoordinate();
  var circle = os.geo.interpolateEllipse(start, distance, distance, 0);
  return new ol.geom.Polygon([circle]);
};


/**
 * Get the offset to use when splitting a geometry for buffering.
 * @param {ol.Extent} extent The geometry's extent.
 * @param {number} distance The buffer distance.
 * @return {number} The offset between boxes to accurately buffer the geometry.
 */
os.geo.jsts.getSplitOffset = function(extent, distance) {
  var boxWidth = os.geo.jsts.UTM_WIDTH_DEGREES;
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
      var offset = os.geo.jsts.UTM_WIDTH_DEGREES - c2[0];

      // return the offset if it's positive and will not exceed the split limit
      if (offset > 0 && (extent[2] - extent[0]) / offset <= os.geo.jsts.UTM_SPLIT_LIMIT) {
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
 * @param {ol.geom.Geometry} geometry The geometry to split.
 * @param {number} distance The buffer distance.
 * @return {Array<!jsts.geom.Polygon>|undefined}
 * @private
 */
os.geo.jsts.getBoxesForExtent_ = function(geometry, distance) {
  var boxes;

  var extent = geometry.getExtent();
  var offset = os.geo.jsts.getSplitOffset(extent, distance);
  if (offset >= 0) {
    boxes = [];

    // offset of 0 means no split is necessary, greater than 0 should be split
    if (offset > 0) {
      var olp = os.geo.jsts.OLParser.getInstance();
      for (var i = extent[0]; i < extent[2]; i += offset) {
        var box = ol.geom.Polygon.fromExtent([i, extent[1], i + os.geo.jsts.UTM_WIDTH_DEGREES, extent[3]]);
        boxes.push(olp.read(box));
      }
    }
  }

  return boxes;
};


/**
 * Split a geometry by UTM zone, buffer, and join.
 * @param {ol.geom.Geometry} geometry The geometry.
 * @param {number} distance The buffer distance in meters.
 * @return {ol.geom.Geometry} The buffered geometry.
 * @private
 */
os.geo.jsts.splitAndBuffer_ = function(geometry, distance) {
  var buffered = null;

  // convert to a JSTS geometry
  var olp = os.geo.jsts.OLParser.getInstance();
  var jstsGeometry = olp.read(geometry);

  var boxes = os.geo.jsts.getBoxesForExtent_(geometry, distance);
  if (boxes && boxes.length < os.geo.jsts.UTM_SPLIT_LIMIT) {
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
        var buffer = os.geo.jsts.tmercBuffer_(splitGeometries[i], distance, avgLon);
        if (buffer) {
          buffers.push(buffer);
        }
      }

      // merge the buffered geometries to create the final buffer region
      if (buffers.length > 0) {
        buffered = os.geo.jsts.merge(buffers);
      }
    }
  }

  return buffered;
};


/**
 * Transform a geometry to transverse mercator, then create a buffer.
 * @param {ol.geom.Geometry} geometry The geometry.
 * @param {number} distance The buffer distance in meters.
 * @param {number=} opt_normalizeLon Longitude to use for normalization.
 * @return {ol.geom.Geometry} The buffered geometry.
 * @private
 */
os.geo.jsts.tmercBuffer_ = function(geometry, distance, opt_normalizeLon) {
  var buffer = null;

  if (geometry) {
    var projection = os.geo.jsts.createTMercProjection_(geometry);
    buffer = os.geo.jsts.projectionBuffer_(geometry, distance, projection, opt_normalizeLon);

    // clear the transform functions from the cache, since we're using a custom projection with a shared code
    var epsg4326 = ol.proj.get(os.proj.EPSG4326);
    ol.proj.transforms.remove(epsg4326, projection);
    ol.proj.transforms.remove(projection, epsg4326);
  }

  return buffer;
};


/**
 * Transform a geometry to a polar projection, then create a buffer.
 * @param {ol.geom.Geometry} geometry The geometry.
 * @param {number} distance The buffer distance in meters.
 * @return {ol.geom.Geometry} The buffered geometry.
 * @private
 */
os.geo.jsts.polarBuffer_ = function(geometry, distance) {
  var buffer = null;

  if (geometry) {
    var projection;
    var center = ol.extent.getCenter(geometry.getExtent());
    if (center[1] > 0) {
      // use stereographic north projection
      projection = ol.proj.get(os.proj.EPSG3413);
    } else {
      // use stereographic south projection
      projection = ol.proj.get(os.proj.EPSG3031);
    }

    if (projection) {
      geometry.transform(os.proj.EPSG4326, projection);
      buffer = os.geo.jsts.projectionBuffer_(geometry, distance, projection);
    }
  }

  return buffer;
};


/**
 * Transform a geometry to transverse mercator, then create a buffer.
 * @param {!ol.geom.Geometry} geometry The geometry.
 * @param {number} distance The buffer distance in meters.
 * @param {!ol.proj.Projection} projection The projection.
 * @param {number=} opt_normalizeLon Longitude to use for normalization.
 * @return {ol.geom.Geometry} The buffered geometry.
 * @private
 */
os.geo.jsts.projectionBuffer_ = function(geometry, distance, projection, opt_normalizeLon) {
  var buffer = null;

  var olp = os.geo.jsts.OLParser.getInstance();
  var jstsGeo = olp.read(geometry);
  if (jstsGeo) {
    // simplify the geometry within 1% of the target buffer distance. this significantly improves buffer performance,
    // and in testing introduced ~0.1% error to the buffer.
    var simplified = jsts.simplify.DouglasPeuckerSimplifier.simplify(jstsGeo, Math.abs(distance * 0.01));
    var jstsBuffer = simplified.buffer(distance);
    if (!jstsBuffer.isEmpty()) {
      buffer = olp.write(jstsBuffer);
      os.geo.jsts.fromBufferProjection_(buffer, projection, opt_normalizeLon);
    }
  }

  return buffer;
};


/**
 * Transform the geometry to a projection for buffering.
 * @param {!ol.geom.Geometry} geometry The geometry.
 * @return {!ol.proj.Projection} The projection.
 * @private
 */
os.geo.jsts.createTMercProjection_ = function(geometry) {
  // create a transverse mercator projection with the origin at the center of the geometry's extent
  var origin = ol.extent.getCenter(geometry.getExtent());
  proj4.defs('bufferCRS', '+ellps=WGS84 +proj=tmerc +lat_0=' + origin[1] + ' +lon_0=' + origin[0] +
      ' +k=1 +x_0=0 +y_0=0');

  var projection = new ol.proj.Projection({code: 'bufferCRS'});
  geometry.transform(os.proj.EPSG4326, projection);

  return projection;
};


/**
 * Transform the geometry from a projection for buffering.
 * @param {ol.geom.Geometry} geometry The geometry.
 * @param {!ol.proj.Projection} projection The projection.
 * @param {number=} opt_normalizeLon Longitude to use for normalization.
 * @private
 */
os.geo.jsts.fromBufferProjection_ = function(geometry, projection, opt_normalizeLon) {
  if (geometry) {
    geometry.transform(projection, os.proj.EPSG4326);
    os.geo.normalizeGeometryCoordinates(geometry, opt_normalizeLon);
  }
};


/**
 * Get / create a valid version of the geometry given. If the geometry is a polygon or multi polygon, self intersections /
 * inconsistencies are fixed. Otherwise the geometry is returned.
 *
 * @param {ol.geom.Geometry|undefined} geometry The geometry to validate.
 * @param {boolean=} opt_quiet If alerts should be suppressed.
 * @return {ol.geom.Geometry|undefined} The validated geometry, or the input geometry if it could not be validated.
 *
 * @see https://stackoverflow.com/questions/31473553
 */
os.geo.jsts.validate = function(geometry, opt_quiet) {
  if (!geometry) {
    return undefined;
  }

  var geomType = geometry.getType();
  if (geomType == ol.geom.GeometryType.POLYGON || geomType == ol.geom.GeometryType.MULTI_POLYGON) {
    try {
      var olp = os.geo.jsts.OLParser.getInstance();
      var jstsPoly = olp.read(geometry);

      // check for empty first because JSTS will throw an error when calling isValid on an empty polygon
      if (jstsPoly.isEmpty()) {
        return geometry;
      }

      var jstsValidPoly;
      if (jstsPoly.isValid()) {
        // if the polygon is already valid, just normalize it. validate does not pick up rings in the wrong order, but
        // normalization will fix that.
        jstsPoly.normalize();
        jstsValidPoly = jstsPoly;
      } else if (jstsPoly instanceof jsts.geom.Polygon) {
        var polygonizer = new jsts.operation.polygonize.Polygonizer();
        os.geo.jsts.addPolygon(jstsPoly, polygonizer);

        jstsValidPoly = os.geo.jsts.toPolygonGeometry(polygonizer.getPolygons(), jstsPoly.getFactory());
      } else if (jstsPoly instanceof jsts.geom.MultiPolygon) {
        var polygonizer = new jsts.operation.polygonize.Polygonizer();
        for (var n = jstsPoly.getNumGeometries(); n-- > 0;) {
          os.geo.jsts.addPolygon(jstsPoly.getGeometryN(n), polygonizer);
        }

        jstsValidPoly = os.geo.jsts.toPolygonGeometry(polygonizer.getPolygons(), jstsPoly.getFactory());
      }

      if (jstsValidPoly && jstsValidPoly.isValid()) {
        // if the polygon perimeter changes by more than 0.5%, warn the user that the area changed but still allow
        // them to use it
        var oldLength = jstsPoly.getLength();
        var diff = Math.abs(oldLength - jstsValidPoly.getLength());
        if (!opt_quiet && diff / oldLength > 0.005) {
          os.alertManager.sendAlert('Area was modified from the original due to invalid topology. Common reasons ' +
              'include polygons that cross or overlap themselves.',
              os.alert.AlertEventSeverity.WARNING);
        }

        // return the validated geometry with properties copied from the original
        var validGeometry = olp.write(jstsValidPoly);
        validGeometry.setProperties(geometry.getProperties());
        return validGeometry;
      }
    } catch (e) {
      goog.log.error(os.geo.jsts.LOGGER_, 'Geometry validation check failed', e);
    }
  }

  // default to returning the original geometry
  return geometry;
};


/**
 * Add all line strings from the polygon given to the polygonizer given
 *
 * @param {jsts.geom.Polygon} polygon from which to extract line strings
 * @param {jsts.operation.polygonize.Polygonizer} polygonizer The polygonizer.
 *
 * @see https://stackoverflow.com/questions/31473553
 */
os.geo.jsts.addPolygon = function(polygon, polygonizer) {
  os.geo.jsts.addLineString(polygon.getExteriorRing(), polygonizer);

  for (var n = polygon.getNumInteriorRing(); n-- > 0;) {
    os.geo.jsts.addLineString(polygon.getInteriorRingN(n), polygonizer);
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
os.geo.jsts.addLineString = function(lineString, polygonizer) {
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
os.geo.jsts.toPolygonGeometry = function(polygons, factory) {
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

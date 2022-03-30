goog.declareModuleId('os.geo.jsts.OLParser');

import GeometryCollection from 'ol/src/geom/GeometryCollection.js';
import GeometryType from 'ol/src/geom/GeometryType.js';
import LinearRing from 'ol/src/geom/LinearRing.js';
import LineString from 'ol/src/geom/LineString.js';
import MultiLineString from 'ol/src/geom/MultiLineString.js';
import MultiPoint from 'ol/src/geom/MultiPoint.js';
import MultiPolygon from 'ol/src/geom/MultiPolygon.js';
import Point from 'ol/src/geom/Point.js';
import Polygon from 'ol/src/geom/Polygon.js';



/**
 * Utility class to translate between OL and JSTS geometries. This was copied from JSTS so the instanceof calls would
 * still work with compiled code.
 */
export default class OLParser {
  /**
   * Constructor.
   * @param {jsts.geom.GeometryFactory=} opt_geometryFactory
   */
  constructor(opt_geometryFactory) {
    if (window['jsts'] == null) {
      throw new Error('JSTS library is not loaded!');
    }

    this.geometryFactory = opt_geometryFactory || new jsts.geom.GeometryFactory();
  }

  /**
   * @param {Geometry} geometry
   * @return {jsts.geom.Geometry}
   */
  read(geometry) {
    if (geometry) {
      var type = geometry.getType();
      switch (type) {
        case GeometryType.POINT:
          return this.convertFromPoint(/** @type {Point} */ (geometry));
        case GeometryType.LINE_STRING:
          return this.convertFromLineString(/** @type {LineString} */ (geometry));
        case GeometryType.LINEAR_RING:
          return this.convertFromLinearRing(/** @type {LinearRing} */ (geometry));
        case GeometryType.POLYGON:
          return this.convertFromPolygon(/** @type {Polygon} */ (geometry));
        case GeometryType.MULTI_POINT:
          return this.convertFromMultiPoint(/** @type {MultiPoint} */ (geometry));
        case GeometryType.MULTI_LINE_STRING:
          return this.convertFromMultiLineString(/** @type {MultiLineString} */ (geometry));
        case GeometryType.MULTI_POLYGON:
          return this.convertFromMultiPolygon(/** @type {MultiPolygon} */ (geometry));
        case GeometryType.GEOMETRY_COLLECTION:
          return this.convertFromCollection(/** @type {GeometryCollection} */ (geometry));
        default:
          break;
      }
    }

    return null;
  }

  /**
   * Convert a {@link jsts.geom.Coordinate} coordinate to an {@link ol.Coordinate}.
   *
   * @param {jsts.geom.Coordinate} coord The JSTS coordinate
   * @return {ol.Coordinate} An OL coordinate
   */
  convertToCoordinate(coord) {
    return coord ? [coord.x, coord.y, coord.z || 0] : null;
  }

  /**
   * Convert an {@link ol.Coordinate} to a {@link jsts.geom.Coordinate}.
   *
   * @param {ol.Coordinate} coord The OL coordinate
   * @return {jsts.geom.Coordinate} A JSTS coordinate
   */
  convertFromCoordinate(coord) {
    return new jsts.geom.Coordinate(coord[0], coord[1], coord[2]);
  }

  /**
   * @param {Point} point
   * @return {jsts.geom.Point}
   */
  convertFromPoint(point) {
    var coord = point.getCoordinates();
    return this.geometryFactory.createPoint(this.convertFromCoordinate(coord));
  }

  /**
   * @param {LineString} lineString
   * @return {jsts.geom.LineString}
   */
  convertFromLineString(lineString) {
    // JSTS doesn't allow null/empty coordinates, so don't create a geometry
    var coordinates = lineString.getCoordinates();
    if (!coordinates || coordinates.length == 0) {
      return null;
    }

    // JSTS will throw an error if there is only one coordinate, so duplicate the coordinate
    if (coordinates.length == 1) {
      coordinates[1] = coordinates[0];
    }

    return this.geometryFactory.createLineString(coordinates.map(this.convertFromCoordinate));
  }

  /**
   * @param {LinearRing} linearRing
   * @return {jsts.geom.LinearRing}
   */
  convertFromLinearRing(linearRing) {
    // ensure closed
    var coords = linearRing.getCoordinates();
    coords[coords.length - 1] = coords[0];
    return this.geometryFactory.createLinearRing(coords.map(this.convertFromCoordinate));
  }

  /**
   * @param {Polygon} polygon
   * @return {jsts.geom.Polygon}
   */
  convertFromPolygon(polygon) {
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
  }

  /**
   * @param {MultiPoint} multiPoint
   * @return {jsts.geom.MultiPoint}
   */
  convertFromMultiPoint(multiPoint) {
    var points = multiPoint.getPoints().map(function(point) {
      return this.convertFromPoint(point);
    }, this);
    return this.geometryFactory.createMultiPoint(points);
  }

  /**
   * @param {MultiLineString} multiLineString
   * @return {jsts.geom.MultiLineString}
   */
  convertFromMultiLineString(multiLineString) {
    var lineStrings = multiLineString.getLineStrings().map(function(lineString) {
      return this.convertFromLineString(lineString);
    }, this);
    return this.geometryFactory.createMultiLineString(lineStrings);
  }

  /**
   * @param {MultiPolygon} multiPolygon
   * @return {jsts.geom.MultiPolygon}
   */
  convertFromMultiPolygon(multiPolygon) {
    var polygons = multiPolygon.getPolygons().map(function(polygon) {
      return this.convertFromPolygon(polygon);
    }, this);
    return this.geometryFactory.createMultiPolygon(polygons);
  }

  /**
   * @param {GeometryCollection} collection
   * @return {jsts.geom.GeometryCollection}
   */
  convertFromCollection(collection) {
    var geometries = collection.getGeometries().map(function(geometry) {
      return this.read(geometry);
    }, this);
    return this.geometryFactory.createGeometryCollection(geometries);
  }

  /**
   * @param {jsts.geom.Geometry} geometry
   * @return {Geometry}
   */
  write(geometry) {
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
  }

  /**
   * @param {jsts.geom.Coordinate} coordinate
   * @return {!Point}
   */
  convertToPoint(coordinate) {
    return new Point(this.convertToCoordinate(coordinate));
  }

  /**
   * @param {jsts.geom.LineString} lineString
   * @return {!LineString}
   */
  convertToLineString(lineString) {
    var points = lineString ? lineString.getCoordinates().map(this.convertToCoordinate) : [];
    return new LineString(points);
  }

  /**
   * @param {jsts.geom.LinearRing} linearRing
   * @return {!LinearRing}
   */
  convertToLinearRing(linearRing) {
    var points = linearRing ? linearRing.getCoordinates().map(this.convertToCoordinate) : [];
    return new LinearRing(points);
  }

  /**
   * @param {jsts.geom.Polygon} polygon
   * @return {!Polygon}
   */
  convertToPolygon(polygon) {
    var rings = [];
    if (polygon) {
      var exterior = polygon.getExteriorRing();
      if (exterior) {
        rings.push(exterior.getCoordinates().map(this.convertToCoordinate));

        var nInteriorRings = polygon.getNumInteriorRing();
        for (var i = 0; i < nInteriorRings; i++) {
          var interiorRing = polygon.getInteriorRingN(i);
          if (interiorRing) {
            rings.push(interiorRing.getCoordinates().map(this.convertToCoordinate));
          }
        }
      }
    }

    return new Polygon(rings);
  }

  /**
   * @param {jsts.geom.MultiPoint} multiPoint
   * @return {!MultiPoint}
   */
  convertToMultiPoint(multiPoint) {
    var points = multiPoint ? multiPoint.getCoordinates().map(this.convertToCoordinate) : [];
    return new MultiPoint(points);
  }

  /**
   * @param {jsts.geom.MultiLineString} multiLineString
   * @return {!MultiLineString}
   */
  convertToMultiLineString(multiLineString) {
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

    return new MultiLineString(lineStrings);
  }

  /**
   * @param {jsts.geom.MultiPolygon} multiPolygon
   * @return {!MultiPolygon}
   */
  convertToMultiPolygon(multiPolygon) {
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

    return new MultiPolygon(polygons);
  }

  /**
   * @param {jsts.geom.GeometryCollection} geometryCollection
   * @return {!GeometryCollection}
   */
  convertToCollection(geometryCollection) {
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

    return new GeometryCollection(geometries);
  }

  /**
   * Get the global instance.
   * @return {!OLParser}
   */
  static getInstance() {
    if (!instance) {
      instance = new OLParser();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {OLParser} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {OLParser|undefined}
 */
let instance;

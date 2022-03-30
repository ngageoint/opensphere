goog.declareModuleId('plugin.file.shp');

import GeometryLayout from 'ol/src/geom/GeometryLayout.js';
import GeometryType from 'ol/src/geom/GeometryType.js';

/**
 * SHP shape types.
 * @enum {number}
 */
export const TYPE = {
  NULLRECORD: 0,
  POINT: 1,
  POLYLINE: 3,
  POLYGON: 5,
  MULTIPOINT: 8,
  POINTZ: 11,
  POLYLINEZ: 13,
  POLYGONZ: 15,
  MULTIPOINTZ: 18,
  POINTM: 21,
  POLYLINEM: 23,
  POLYGONM: 25,
  MULTIPOINTM: 28
};

/**
 * @typedef {{
 *   data: DataView,
 *   numRecords: number
 * }}
 */
export let DBFData;

/**
 * Tests if the supplied content is for a DBF file.
 *
 * @param {ArrayBuffer} content
 * @return {boolean}
 */
export const isDBFFileType = function(content) {
  if (!content) {
    return false;
  }

  if (content.byteLength < 4) {
    return false;
  }
  var dv = new DataView(content.slice(0, 4));
  var type = dv.getUint32(0);

  // dBASE Header bytes:
  // 0: 3 indicates dBASE version 5, 4 indicates dBASE version 7
  // 1-3: YYMMDD, with YY representing number of years since 1900
  var date = type & 0xFF;
  var month = (type >> 8) & 0xFF;
  var version = (type >> 24) & 0xFF;
  return version == 3 && (date >= 1 && date <= 31) && (month >= 1 && month <= 12);
};

/**
 * Tests if the supplied content is for a SHP file.
 *
 * @param {ArrayBuffer} content
 * @return {boolean}
 */
export const isSHPFileType = function(content) {
  var dv = new DataView(content.slice(0, 4));
  try {
    return dv.getUint32(0) == 9994;
  } catch (e) {
    return false;
  }
};

/**
 * Flattens geometry coordinates down to an array of coordinate groups.
 * @param {!Array} coordinates The current coordinates.
 * @return {!Array<!Array<number>>} The coordinate groups.
 */
export const getFlatGroupCoordinates = (coordinates) => {
  // We're trying to collapse down to an array of arrays of numbers (ie, array of coordinates).
  while (Array.isArray(coordinates) && Array.isArray(coordinates[0]) && Array.isArray(coordinates[0][0])) {
    coordinates = coordinates.flat(1);
  }

  return coordinates;
};

/**
 * From an OpenLayers geometry, get the array of SHP parts for that geometry type.
 * @param {SimpleGeometry} geometry The geometry.
 * @return {!Array} The SHP parts for the geometry.
 */
export const getPartCoordinatesFromGeometry = (geometry) => {
  let partCoordinates;

  if (geometry) {
    const coordinates = geometry.getCoordinates();
    const geomType = geometry.getType();

    //
    // OpenLayers structures geometry coordinates from getCoordinates as:
    //  - Point: The coordinate
    //  - MultiPoint: Array of coordinates
    //  - LineString: Array of coordinates
    //  - MultiLineString: Array of lines -> coordinates
    //  - Polygon: Array of rings -> coordinates
    //  - MultiPolygon: Array of polygons -> rings -> coordinates
    //
    // SHP handles multi geometries with a "parts" value that specifies the number of points/lines/rings. It also only
    // has a distinct shape type for MultiPoint, both line and polygon use the same shape whether there is a single geom
    // or multiple. The following converts OpenLayers coordinates to SHP parts for all supported geometry types.
    //
    switch (geomType) {
      case GeometryType.POINT:
        // Each part is a point, add a level.
        partCoordinates = [coordinates];
        break;
      case GeometryType.MULTI_POINT:
        // Each part is a point, all set.
        partCoordinates = coordinates;
        break;
      case GeometryType.LINE_STRING:
        // Each part is a line, add a level.
        partCoordinates = [coordinates];
        break;
      case GeometryType.MULTI_LINE_STRING:
        // Each part is a line, all set.
        partCoordinates = coordinates;
        break;
      case GeometryType.POLYGON:
        // Each part is a ring, all set.
        partCoordinates = coordinates;
        break;
      case GeometryType.MULTI_POLYGON:
        // Each part is a ring, flatten by one level.
        partCoordinates = coordinates.flat(1);
        break;
      default:
        // Unsupported geometry type.
        break;
    }
  }

  return partCoordinates || [];
};

/**
 * Get the SHP shape type for a geometry.
 * @param {SimpleGeometry} geometry The geometry.
 * @return {number} The SHP shape type, or undefined if not supported.
 */
export const getShapeTypeFromGeometry = (geometry) => {
  let shapeType = -1;

  if (geometry) {
    let hasZ = false;
    const geomLayout = geometry.getLayout();
    if (geomLayout === GeometryLayout.XYZ) {
      // Determine if the geometry has a non-zero altitude, otherwise we'll ignore altitude to save space.
      const flatCoordinates = geometry.getFlatCoordinates();
      const stride = geometry.getStride();
      for (let i = 0; i < flatCoordinates.length; i += stride) {
        if (flatCoordinates[i + 2] != 0) {
          hasZ = true;
          break;
        }
      }
    }

    const geomType = geometry.getType();
    switch (geomType) {
      case GeometryType.POINT:
        shapeType = hasZ ? TYPE.POINTZ : TYPE.POINT;
        break;
      case GeometryType.MULTI_POINT:
        shapeType = hasZ ? TYPE.MULTIPOINTZ : TYPE.MULTIPOINT;
        break;
      case GeometryType.LINE_STRING:
      case GeometryType.MULTI_LINE_STRING:
        shapeType = hasZ ? TYPE.POLYLINEZ : TYPE.POLYLINE;
        break;
      case GeometryType.POLYGON:
      case GeometryType.MULTI_POLYGON:
        shapeType = hasZ ? TYPE.POLYGONZ : TYPE.POLYGON;
        break;
      default:
        break;
    }
  }

  return shapeType;
};

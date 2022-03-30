goog.declareModuleId('os.ogc.spatial');

import GML from 'ol/src/format/GML.js';
import GeometryType from 'ol/src/geom/GeometryType.js';
import {pushParseAndPop} from 'ol/src/xml.js';

import {createPolarPolygon, isPolarPolygon} from '../geo/geo.js';
import {interpolateGeom} from '../interpolate.js';
import {PLACEMARK_PARSERS} from '../ol/format/KML.js';
import Format from './format.js';

/**
 * Convert an element containing a KML geometry to an Feature.
 *
 * @param {Document|Element} element The element containing a KML geometry
 * @return {ol.geom.Geometry} The geometry
 *
 * @suppress {accessControls} Because OL3 decided not to let us use their code...
 */
export const readKMLGeometry = function(element) {
  if (element) {
    var obj = pushParseAndPop({'geometry': null}, PLACEMARK_PARSERS, element, []);
    if (obj && obj['geometry'] instanceof ol.geom.Geometry) {
      return obj['geometry'];
    }
  }

  return null;
};

/**
 * Convert a GML geometry node to an ol.geom.Geometry.
 *
 * @param {Element} element The element containing a geometry
 * @return {ol.geom.Geometry} The geometry
 *
 * @suppress {accessControls} Because OL3 decided not to let us use their code...
 */
export const readGMLGeometry = function(element) {
  var geom = null;
  if (element) {
    var gmlFormat = new GML();
    geom = gmlFormat.readGeometryFromNode(element);
  }

  return geom;
};

/**
 * Serializes a set of coordinates to a string.
 *
 * @param {Array.<ol.Coordinate>} coords The coordinates
 * @param {string=} opt_separator The separator
 * @return {string} Serialized coordinates
 */
export const formatCoords = function(coords, opt_separator) {
  var separator = opt_separator || ',';
  var n = coords.length;

  var ring = [];
  for (var i = 0; i < n; i++) {
    ring.push(coords[i][0] + separator + coords[i][1]);
  }

  if (coords.length > 2) {
    var first = coords[0];
    var last = coords[n - 1];
    var e = 1E-12;

    if (Math.abs(first[0] - last[0]) > e || Math.abs(first[1] - last[1]) > e) {
      // the polygon isn't closed, so close it
      ring.push(ring[0]);
    } else {
      // ensure ring is closed despite any round-off error
      ring[ring.length - 1] = ring[0];
    }
  }

  return ring.join(' ');
};

/**
 * Formats an {@link ol.Extent} to a GML string. KML is currently unsupported.
 *
 * @param {ol.Extent} extent The extent to format
 * @param {string} column The BBOX column
 * @param {string=} opt_name The namehint for the BBOX
 * @param {string=} opt_description The description for the BBOX
 * @param {string=} opt_id The id for the BBOX
 * @return {string}
 *
 * @todo KML support?
 */
export const formatExtent = function(extent, column, opt_name, opt_description, opt_id) {
  var bbox = '<BBOX';
  if (opt_name) {
    bbox += ' areanamehint="' + opt_name + '"';
  }
  if (opt_description) {
    bbox += ' description="' + opt_description + '"';
  }
  if (opt_id) {
    bbox += ' id="' + opt_id + '"';
  }
  bbox += '>';
  return bbox + '<PropertyName>' + column + '</PropertyName><gml:Envelope srsName="CRS:84">' +
      '<gml:lowerCorner>' + extent[0] + ' ' + extent[1] + '</gml:lowerCorner>' +
      '<gml:upperCorner>' + extent[2] + ' ' + extent[3] + '</gml:upperCorner>' +
      '</gml:Envelope></BBOX>';
};

/**
 * Serializes a polygon or linestring geometry to GML or KML.
 *
 * @param {ol.geom.Geometry} geom The geometry to format
 * @param {string=} opt_column The column name
 * @param {string=} opt_name The namehint
 * @param {string=} opt_description The description
 * @param {string=} opt_id The id
 * @return {?string} The serialized polygon, or null if the geometry is not supported
 */
export const formatGMLIntersection = function(geom, opt_column, opt_name, opt_description, opt_id) {
  interpolateGeom(geom);

  var parts = [];
  var formattedPolygon = formatPolygon(geom, Format.GML);
  if (formattedPolygon) {
    parts.push('<Intersects');

    if (opt_name) {
      parts.push(' areanamehint="' + opt_name + '"');
    }
    if (opt_description) {
      parts.push(' description="' + opt_description + '"');
    }
    if (opt_id) {
      parts.push(' id="' + opt_id + '"');
    }

    parts.push('>', '<PropertyName>', (opt_column || 'none'), '</PropertyName>', formattedPolygon, '</Intersects>');
  }

  return parts.length > 0 ? parts.join('') : null;
};

/**
 * Serializes a polygon or linestring geometry to GML or KML.
 *
 * @param {ol.geom.Geometry} geom The geometry to format
 * @param {string=} opt_format The output format, defaults to GML
 * @return {?string} The serialized polygon, or null if the geometry is not supported
 */
export const formatPolygon = function(geom, opt_format) {
  if (!geom) {
    return null;
  }

  var polyCoords;
  switch (geom.getType()) {
    case GeometryType.LINE_STRING:
      var lineCoords = /** @type {LineString} */ (geom).getCoordinates();
      polyCoords = [lineCoords];
      break;
    case GeometryType.POLYGON:
      polyCoords = /** @type {Polygon} */ (geom).getCoordinates();

      // polygons that cross a pole will not return the expected results after being projected, so correct for that
      if (polyCoords.length == 1 && isPolarPolygon(polyCoords[0])) {
        polyCoords = [createPolarPolygon(polyCoords[0])];
      }
      break;
    case GeometryType.MULTI_LINE_STRING:
      return formatMultiPolygon(geom, opt_format);
    case GeometryType.MULTI_POLYGON:
      return formatMultiPolygon(geom, opt_format);
    default:
      // unsupported geometry type
      return null;
  }

  var parts = [];
  if (polyCoords && polyCoords.length > 0) {
    var format = opt_format || Format.GML;
    var separator = format == Format.GML ? ' ' : ',';
    parts.push(format == Format.GML ?
      '<gml:Polygon xmlns:gml="http://www.opengis.net/gml"><gml:exterior><gml:LinearRing>' +
        '<gml:posList srsDimension="2" srsName="CRS:84">' :
      '<kml:Polygon xmlns:kml="http://www.opengis.net/kml/2.2">' +
        '<kml:outerBoundaryIs><kml:LinearRing><kml:coordinates>');

    // format outer ring
    parts.push(formatCoords(polyCoords[0], separator));

    parts.push(format == Format.GML ?
      '</gml:posList></gml:LinearRing></gml:exterior>' :
      '</kml:coordinates></kml:LinearRing></kml:outerBoundaryIs>');

    // format interior rings
    for (var i = 1, n = polyCoords.length; i < n; i++) {
      parts.push(format == Format.GML ?
        '<gml:interior><gml:LinearRing><gml:posList srsDimension="2" srsName="CRS:84">' :
        '<kml:innerBoundaryIs><kml:LinearRing><kml:coordinates>');

      parts.push(formatCoords(polyCoords[i], separator));

      parts.push(format == Format.GML ?
        '</gml:posList></gml:LinearRing></gml:interior>' :
        '</kml:coordinates></kml:LinearRing></kml:innerBoundaryIs>');
    }

    parts.push(format == Format.GML ? '</gml:Polygon>' : '</kml:Polygon>');
  }

  return parts.length > 0 ? parts.join('') : null;
};

/**
 * Serializes a polygon or linestring geometry to GML or KML.
 *
 * @param {ol.geom.Geometry} geom The geometry to format
 * @param {string=} opt_format The output format, defaults to GML
 * @return {?string} The serialized polygon, or null if the geometry is not supported
 */
export const formatMultiPolygon = function(geom, opt_format) {
  if (!geom) {
    return null;
  }

  var geometries;
  switch (geom.getType()) {
    case GeometryType.MULTI_LINE_STRING:
      geometries = /** @type {ol.geom.MultiLineString} */ (geom).getLineStrings();
      break;
    case GeometryType.MULTI_POLYGON:
      geometries = /** @type {ol.geom.MultiPolygon} */ (geom).getPolygons();
      break;
    default:
      // unsupported geometry type
      return null;
  }

  // MultiSurface should be used for GML3, MultiPolygon for GML2
  // TODO: how do we know which version of GML to use?
  var useMultiSurface = false;
  var format = opt_format || Format.GML;
  var useGML = format === Format.GML;

  var parts = [];
  if (geometries && geometries.length > 0) {
    var baseElement;
    var namespace;
    var memberElement;
    if (useGML) {
      baseElement = useMultiSurface ? 'gml:MultiSurface' : 'gml:MultiPolygon';
      memberElement = useMultiSurface ? 'gml:surfaceMember' : 'gml:polygonMember';
      namespace = 'xmlns:gml="http://www.opengis.net/gml"';
    } else {
      baseElement = 'kml:MultiGeometry';
      namespace = 'xmlns:kml="http://www.opengis.net/kml/2.2"';
    }

    // make sure we can create at least one polygon first
    var polyParts = [];
    for (var i = 0; i < geometries.length; i++) {
      var formattedPolygon = formatPolygon(geometries[i], format);
      if (formattedPolygon) {
        if (memberElement) {
          polyParts.push('<' + memberElement + '>');
        }
        polyParts.push(formattedPolygon);
        if (memberElement) {
          polyParts.push('</' + memberElement + '>');
        }
      }
    }

    if (polyParts.length > 0) {
      parts.push('<', baseElement, ' ', namespace, '>', polyParts.join(''),
          '</', baseElement, '>');
    }
  }

  return parts.length > 0 ? parts.join('') : null;
};

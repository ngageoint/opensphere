goog.provide('os.ogc.spatial');
goog.provide('os.ogc.spatial.Format');
goog.require('goog.string');
goog.require('ol.Feature');
goog.require('ol.format.GML');
goog.require('ol.format.KML');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Polygon');
goog.require('ol.xml');


/**
 * Supported spatial formats.
 * @enum {string}
 */
os.ogc.spatial.Format = {
  GML: 'GML',
  KML: 'KML'
};


/**
 * Convert an element containing a KML geometry to an ol.Feature.
 * @param {Element} element The element containing a KML geometry
 * @return {ol.geom.Geometry} The geometry
 *
 * @suppress {accessControls} Because OL3 decided not to let us use their code...
 */
os.ogc.spatial.readKMLGeometry = function(element) {
  if (element) {
    var obj = ol.xml.pushParseAndPop({'geometry': null}, ol.format.KML.PLACEMARK_PARSERS_, element, []);
    if (obj && obj['geometry'] instanceof ol.geom.Geometry) {
      return obj['geometry'];
    }
  }

  return null;
};


/**
 * Convert a GML geometry node to an ol.geom.Geometry.
 * @param {Element} element The element containing a geometry
 * @return {ol.geom.Geometry} The geometry
 *
 * @suppress {accessControls} Because OL3 decided not to let us use their code...
 */
os.ogc.spatial.readGMLGeometry = function(element) {
  var geom = null;
  if (element) {
    var gmlFormat = new ol.format.GML();
    geom = gmlFormat.readGeometryFromNode(element);
  }

  return geom;
};


/**
 * Serializes a set of coordinates to a string.
 * @param {Array.<ol.Coordinate>} coords The coordinates
 * @param {string=} opt_separator The separator
 * @return {string} Serialized coordinates
 */
os.ogc.spatial.formatCoords = function(coords, opt_separator) {
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
 * @param {ol.Extent} extent The extent to format
 * @param {string} column The BBOX column
 * @param {string=} opt_name The namehint for the BBOX
 * @param {string=} opt_description The description for the BBOX
 * @return {string}
 *
 * @todo KML support?
 */
os.ogc.spatial.formatExtent = function(extent, column, opt_name, opt_description) {
  var bbox = '<BBOX';
  if (opt_name) {
    bbox += ' areanamehint="' + opt_name + '"';
  }
  if (opt_description) {
    bbox += ' description="' + opt_description + '"';
  }
  bbox += '>';
  return bbox + '<PropertyName>' + column + '</PropertyName><gml:Envelope srsName="CRS:84">' +
      '<gml:lowerCorner>' + extent[0] + ' ' + extent[1] + '</gml:lowerCorner>' +
      '<gml:upperCorner>' + extent[2] + ' ' + extent[3] + '</gml:upperCorner>' +
      '</gml:Envelope></BBOX>';
};


/**
 * Serializes a polygon or linestring geometry to GML or KML.
 * @param {ol.geom.Geometry} geom The geometry to format
 * @param {string=} opt_column The column name
 * @param {string=} opt_name The namehint
 * @param {string=} opt_description The description
 * @return {?string} The serialized polygon, or null if the geometry is not supported
 */
os.ogc.spatial.formatGMLIntersection = function(geom, opt_column, opt_name, opt_description) {
  os.interpolate.interpolateGeom(geom);

  var parts = [];
  var formattedPolygon = os.ogc.spatial.formatPolygon(geom, os.ogc.spatial.Format.GML);
  if (formattedPolygon) {
    parts.push('<Intersects');

    if (opt_name) {
      parts.push(' areanamehint="' + opt_name + '"');
    }
    if (opt_description) {
      parts.push(' description="' + opt_description + '"');
    }

    parts.push('>', '<PropertyName>', (opt_column || 'none'), '</PropertyName>', formattedPolygon, '</Intersects>');
  }

  return parts.length > 0 ? parts.join('') : null;
};


/**
 * Serializes a polygon or linestring geometry to GML or KML.
 * @param {ol.geom.Geometry} geom The geometry to format
 * @param {string=} opt_format The output format, defaults to GML
 * @return {?string} The serialized polygon, or null if the geometry is not supported
 */
os.ogc.spatial.formatPolygon = function(geom, opt_format) {
  if (!geom) {
    return null;
  }

  var polyCoords;
  switch (geom.getType()) {
    case ol.geom.GeometryType.LINE_STRING:
      var lineCoords = /** @type {ol.geom.LineString} */ (geom).getCoordinates();
      polyCoords = [lineCoords];
      break;
    case ol.geom.GeometryType.POLYGON:
      polyCoords = /** @type {ol.geom.Polygon} */ (geom).getCoordinates();

      // polygons that cross a pole will not return the expected results after being projected, so correct for that
      if (polyCoords.length == 1 && os.geo.isPolarPolygon(polyCoords[0])) {
        polyCoords = [os.geo.createPolarPolygon(polyCoords[0])];
      }
      break;
    case ol.geom.GeometryType.MULTI_LINE_STRING:
      return os.ogc.spatial.formatMultiPolygon(geom, opt_format);
    case ol.geom.GeometryType.MULTI_POLYGON:
      return os.ogc.spatial.formatMultiPolygon(geom, opt_format);
    default:
      // unsupported geometry type
      return null;
  }

  var parts = [];
  if (polyCoords && polyCoords.length > 0) {
    var format = opt_format || os.ogc.spatial.Format.GML;
    var separator = format == os.ogc.spatial.Format.GML ? ' ' : ',';
    parts.push(format == os.ogc.spatial.Format.GML ?
        '<gml:Polygon xmlns:gml="http://www.opengis.net/gml"><gml:exterior><gml:LinearRing>' +
        '<gml:posList srsDimension="2" srsName="CRS:84">' :
        '<kml:Polygon xmlns:kml="http://www.opengis.net/kml/2.2">' +
        '<kml:outerBoundaryIs><kml:LinearRing><kml:coordinates>');

    // format outer ring
    parts.push(os.ogc.spatial.formatCoords(polyCoords[0], separator));

    parts.push(format == os.ogc.spatial.Format.GML ?
        '</gml:posList></gml:LinearRing></gml:exterior>' :
        '</kml:coordinates></kml:LinearRing></kml:outerBoundaryIs>');

    // format interior rings
    for (var i = 1, n = polyCoords.length; i < n; i++) {
      parts.push(format == os.ogc.spatial.Format.GML ?
          '<gml:interior><gml:LinearRing><gml:posList srsDimension="2" srsName="CRS:84">' :
          '<kml:innerBoundaryIs><kml:LinearRing><kml:coordinates>');

      parts.push(os.ogc.spatial.formatCoords(polyCoords[i], separator));

      parts.push(format == os.ogc.spatial.Format.GML ?
          '</gml:posList></gml:LinearRing></gml:interior>' :
          '</kml:coordinates></kml:LinearRing></kml:innerBoundaryIs>');
    }

    parts.push(format == os.ogc.spatial.Format.GML ? '</gml:Polygon>' : '</kml:Polygon>');
  }

  return parts.length > 0 ? parts.join('') : null;
};


/**
 * Serializes a polygon or linestring geometry to GML or KML.
 * @param {ol.geom.Geometry} geom The geometry to format
 * @param {string=} opt_format The output format, defaults to GML
 * @return {?string} The serialized polygon, or null if the geometry is not supported
 */
os.ogc.spatial.formatMultiPolygon = function(geom, opt_format) {
  if (!geom) {
    return null;
  }

  var geometries;
  switch (geom.getType()) {
    case ol.geom.GeometryType.MULTI_LINE_STRING:
      geometries = /** @type {ol.geom.MultiLineString} */ (geom).getLineStrings();
      break;
    case ol.geom.GeometryType.MULTI_POLYGON:
      geometries = /** @type {ol.geom.MultiPolygon} */ (geom).getPolygons();
      break;
    default:
      // unsupported geometry type
      return null;
  }

  // MultiSurface should be used for GML3, MultiPolygon for GML2
  // TODO: how do we know which version of GML to use?
  var useMultiSurface = false;
  var format = opt_format || os.ogc.spatial.Format.GML;
  var useGML = format === os.ogc.spatial.Format.GML;

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
      var formattedPolygon = os.ogc.spatial.formatPolygon(geometries[i], format);
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

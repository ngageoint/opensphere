goog.provide('os.ui.query.AbstractQueryReader');
goog.require('goog.asserts');
goog.require('ol.Feature');
goog.require('ol.format.GML3');
goog.require('ol.geom.Polygon');
goog.require('os.ui.query.IQueryReader');



/**
 * Abstract implementation of IQueryReader.
 * @implements {os.ui.query.IQueryReader}
 * @constructor
 */
os.ui.query.AbstractQueryReader = function() {
  /**
   * @type {?string}
   * @protected
   */
  this.layerId = null;

  /**
   * @type {?Element}
   * @protected
   */
  this.filter = null;
};


/**
 * The logger.
 * @const
 * @type {goog.debug.Logger}
 * @private
 */
os.ui.query.AbstractQueryReader.LOGGER_ = goog.log.getLogger('os.ui.query.AbstractQueryReader');


/**
 * @type {string}
 * @const
 */
os.ui.query.AbstractQueryReader.GML_NAMESPACE = 'http://www.opengis.net/gml';


/**
 * @type {ol.format.GML3}
 * @const
 */
os.ui.query.AbstractQueryReader.GML_READER = new ol.format.GML3();


/**
 * @inheritDoc
 */
os.ui.query.AbstractQueryReader.prototype.setFilter = function(filter) {
  this.filter = filter;
};


/**
 * @inheritDoc
 */
os.ui.query.AbstractQueryReader.prototype.setLayerId = function(layerId) {
  this.layerId = layerId;
};


/**
 * @inheritDoc
 */
os.ui.query.AbstractQueryReader.prototype.parseEntries = goog.abstractMethod;


/**
 * Parses an area and turns it into a feature.
 * @param {Node} area The list of area elements
 * @return {?ol.Feature}
 * @suppress {accessControls}
 */
os.ui.query.AbstractQueryReader.parseArea = function(area) {
  try {
    if (area.localName in
        os.ui.query.AbstractQueryReader.GML_READER.GEOMETRY_PARSERS_[os.ui.query.AbstractQueryReader.GML_NAMESPACE]) {
      var geom = os.xml.createElementNS('GEOM', os.ui.query.AbstractQueryReader.GML_NAMESPACE);
      geom.appendChild(area);
      var olGeom = os.ui.query.AbstractQueryReader.GML_READER.readGeometryElement(geom, [{}]);
      if (olGeom instanceof Array) {
        var coordinates = os.geo.extentToCoordinates(olGeom);
        olGeom = new ol.geom.Polygon([coordinates], ol.geom.GeometryLayout.XY);
      }

      if (olGeom instanceof ol.geom.Polygon) {
        os.ui.query.AbstractQueryReader.normalizePolygon_(olGeom);
      } else if (olGeom instanceof ol.geom.MultiPolygon) {
        var polygons = olGeom.getPolygons();
        for (var i = 0, n = polygons.length; i < n; i++) {
          os.ui.query.AbstractQueryReader.normalizePolygon_(polygons[i]);
        }
      }

      // set the geometry to not be interpolated
      olGeom.set(os.interpolate.METHOD_FIELD, os.interpolate.Method.NONE);

      var feature = new ol.Feature();
      var name = os.xml.unescape(area.getAttribute('areanamehint') || area.getAttribute('namehint') || 'New Area');
      feature.setId(goog.string.getRandomString());
      feature.setGeometry(olGeom);
      feature.set('temp', true);
      feature.set('title', name);
      return feature;
    }
    return null;
  } catch (e) {
    goog.log.error(os.ui.query.AbstractQueryReader.LOGGER_, 'Failed to parse area!');
  }
};


/**
 * Takes a polygon and normalizes its longitudes to [-180, 180] by reference
 * @param {ol.geom.Polygon} polygon
 * @private
 */
os.ui.query.AbstractQueryReader.normalizePolygon_ = function(polygon) {
  var allPolygonsNormalization = goog.array.every(polygon.getCoordinates(), function(coordArray) {
    return os.geo.shouldNormalize(coordArray);
  });

  if (allPolygonsNormalization) {
    var flatCoordinates = polygon.getFlatCoordinates();
    var stride = polygon.getStride();
    for (var i = 0, n = flatCoordinates.length; i < n; i = i + stride) {
      var coord = flatCoordinates[i];
      var normalizedCoord = os.geo.normalizeLongitude(coord);
      flatCoordinates[i] = normalizedCoord;
    }
  }
};

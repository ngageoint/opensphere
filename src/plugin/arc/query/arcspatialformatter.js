goog.provide('plugin.arc.query.ArcSpatialFormatter');

goog.require('ol.geom.GeometryType');
goog.require('ol.geom.Polygon');
goog.require('os.filter.ISpatialFormatter');
goog.require('os.geo');
goog.require('os.interpolate');
goog.require('os.ogc.spatial');
goog.require('os.xml');



/**
 * Formats a spatial query for use in an Arc Filter.
 * @implements {os.filter.ISpatialFormatter}
 * @constructor
 */
plugin.arc.query.ArcSpatialFormatter = function() {};


/**
 * @inheritDoc
 */
plugin.arc.query.ArcSpatialFormatter.prototype.format = function(feature) {
  var result = '';
  if (feature && feature.getGeometry()) {
    var geometry = feature.getGeometry().clone().toLonLat();
    var method = /** @type {os.interpolate.Method|undefined} */ (feature.get(os.interpolate.METHOD_FIELD));

    os.interpolate.beginTempInterpolation(os.proj.EPSG4326, method);
    os.interpolate.interpolateGeom(geometry);
    os.interpolate.endTempInterpolation();

    var type = geometry.getType();
    var coords = null;

    switch (type) {
      case ol.geom.GeometryType.CIRCLE:
        geometry = /** @type {ol.geom.Circle} */ (geometry);
        var polyCircle = new ol.geom.Polygon([os.geo.interpolateCircle(geometry.getCenter(), geometry.getRadius())]);
        coords = polyCircle.getCoordinates();
        break;
      case ol.geom.GeometryType.MULTI_LINE_STRING:
      case ol.geom.GeometryType.POLYGON:
        geometry = /** @type {ol.geom.Polygon} */ (geometry);
        coords = geometry.getCoordinates();
        break;
      case ol.geom.GeometryType.LINE_STRING:
        geometry = /** @type {ol.geom.LineString} */ (geometry);
        coords = geometry.getCoordinates();
        break;
      case ol.geom.GeometryType.MULTI_POLYGON:
        geometry = /** @type {ol.geom.MultiPolygon} */ (geometry);
        coords = [];

        geometry.getCoordinates().forEach(function(polyCoords) {
          coords = coords.concat(polyCoords);
        });
        break;
      default:
        coords = geometry.getExtent();
        break;
    }

    if (coords) {
      var resultGeom = {'rings': coords};
      result = JSON.stringify(resultGeom);
    }
  }

  return result;
};


/**
 * @inheritDoc
 */
plugin.arc.query.ArcSpatialFormatter.prototype.supportsMultiple = function() {
  return true;
};


/**
 * @inheritDoc
 */
plugin.arc.query.ArcSpatialFormatter.prototype.wrapMultiple = function(value) {
  var polys = value.split('}{');
  var geom = {'rings': []};

  for (var i = 0, ii = polys.length; i < ii; i++) {
    if (!goog.string.startsWith(polys[i], '{')) {
      polys[i] = '{' + polys[i];
    }

    if (!goog.string.endsWith(polys[i], '}')) {
      polys[i] += '}';
    }

    var polyGeom = JSON.parse(polys[i]);
    geom['rings'] = geom['rings'].concat(polyGeom['rings']);
  }

  return JSON.stringify(geom);
};

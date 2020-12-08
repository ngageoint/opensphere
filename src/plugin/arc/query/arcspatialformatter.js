goog.module('plugin.arc.query.ArcSpatialFormatter');
goog.module.declareLegacyNamespace();

goog.require('os.ogc.spatial');
goog.require('os.xml');
const geo = goog.require('os.geo');
const GeometryType = goog.require('ol.geom.GeometryType');
const Polygon = goog.require('ol.geom.Polygon');
const interpolate = goog.require('os.interpolate');

const ISpatialFormatter = goog.requireType('os.filter.ISpatialFormatter');


/**
 * Formats a spatial query for use in an Arc Filter.
 *
 * @implements {ISpatialFormatter}
 */
class ArcSpatialFormatter {
  /**
   * Constructor.
   */
  constructor() {}

  /**
   * @inheritDoc
   */
  format(feature) {
    var result = '';
    if (feature && feature.getGeometry()) {
      var geometry = feature.getGeometry().clone().toLonLat();
      var method = /** @type {interpolate.Method|undefined} */ (feature.get(interpolate.METHOD_FIELD));

      interpolate.beginTempInterpolation(os.proj.EPSG4326, method);
      interpolate.interpolateGeom(geometry);
      interpolate.endTempInterpolation();

      var type = geometry.getType();
      var coords = null;

      switch (type) {
        case GeometryType.CIRCLE:
          geometry = /** @type {ol.geom.Circle} */ (geometry);
          var polyCircle = new Polygon([geo.interpolateCircle(geometry.getCenter(), geometry.getRadius())]);
          coords = polyCircle.getCoordinates();
          break;
        case GeometryType.MULTI_LINE_STRING:
        case GeometryType.POLYGON:
          geometry = /** @type {Polygon} */ (geometry);
          coords = geometry.getCoordinates();
          break;
        case GeometryType.LINE_STRING:
          geometry = /** @type {ol.geom.LineString} */ (geometry);
          coords = geometry.getCoordinates();
          break;
        case GeometryType.MULTI_POLYGON:
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
  }

  /**
   * @inheritDoc
   */
  supportsMultiple() {
    return true;
  }

  /**
   * @inheritDoc
   */
  wrapMultiple(value) {
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
  }
}

exports = ArcSpatialFormatter;

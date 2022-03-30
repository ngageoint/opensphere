goog.declareModuleId('plugin.arc.query.ArcSpatialFormatter');

import GeometryType from 'ol/src/geom/GeometryType.js';
import Polygon from 'ol/src/geom/Polygon.js';
import * as geo from '../../../os/geo/geo.js';
import * as interpolate from '../../../os/interpolate.js';
import * as osProj from '../../../os/proj/proj.js';

const googString = goog.require('goog.string');

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
      var method = /** @type {Method|undefined} */ (feature.get(interpolate.METHOD_FIELD));

      interpolate.beginTempInterpolation(osProj.EPSG4326, method);
      interpolate.interpolateGeom(geometry);
      interpolate.endTempInterpolation();

      var type = geometry.getType();
      var coords = null;

      switch (type) {
        case GeometryType.CIRCLE:
          geometry = /** @type {Circle} */ (geometry);
          var polyCircle = new Polygon([geo.interpolateCircle(geometry.getCenter(), geometry.getRadius())]);
          coords = polyCircle.getCoordinates();
          break;
        case GeometryType.MULTI_LINE_STRING:
        case GeometryType.POLYGON:
          geometry = /** @type {Polygon} */ (geometry);
          coords = geometry.getCoordinates();
          break;
        case GeometryType.LINE_STRING:
          geometry = /** @type {LineString} */ (geometry);
          coords = geometry.getCoordinates();
          break;
        case GeometryType.MULTI_POLYGON:
          geometry = /** @type {MultiPolygon} */ (geometry);
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
      if (!googString.startsWith(polys[i], '{')) {
        polys[i] = '{' + polys[i];
      }

      if (!googString.endsWith(polys[i], '}')) {
        polys[i] += '}';
      }

      var polyGeom = JSON.parse(polys[i]);
      geom['rings'] = geom['rings'].concat(polyGeom['rings']);
    }

    return JSON.stringify(geom);
  }
}

export default ArcSpatialFormatter;

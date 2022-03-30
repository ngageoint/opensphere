goog.declareModuleId('os.ogc.filter.OGCSpatialFormatter');

import GeometryType from 'ol/src/geom/GeometryType.js';
import Polygon from 'ol/src/geom/Polygon.js';

import {interpolateCircle, isRectangular} from '../../geo/geo.js';
import {splitWithinWorldExtent} from '../../geo/jsts.js';
import {beginTempInterpolation, endTempInterpolation, interpolateGeom} from '../../interpolate.js';
import {EPSG4326} from '../../proj/proj.js';
import {escape as xmlEscape} from '../../xml.js';
import {formatExtent, formatGMLIntersection} from '../spatial.js';

const {default: ISpatialFormatter} = goog.requireType('os.filter.ISpatialFormatter');


/**
 * Formats a spatial query for use in an OGC Filter.
 *
 * @implements {ISpatialFormatter}
 */
export default class OGCSpatialFormatter {
  /**
   * Constructor.
   * @param {string=} opt_column
   */
  constructor(opt_column) {
    /**
     * @type {string}
     * @private
     */
    this.column_ = opt_column || defaultColumn;
  }

  /**
   * @inheritDoc
   */
  format(feature) {
    var result = '';
    var geometry = this.getGeometry(feature);
    if (geometry) {
      var type = geometry.getType();

      // Encode area name and description to avoid problems with special chars. The
      // name/desc does not matter.
      var name = xmlEscape(/** @type {string} */ (feature.get('title') || 'New Area'));
      var description = xmlEscape(/** @type {string} */ (feature.get('description')));
      var id = feature.getId() != null ? xmlEscape(feature.getId().toString()) : undefined;

      switch (type) {
        case GeometryType.CIRCLE:
          geometry = /** @type {ol.geom.Circle} */ (geometry);

          var polyCircle = new Polygon([interpolateCircle(geometry.getCenter(), geometry.getRadius())]);
          result = formatGMLIntersection(polyCircle, this.column_, name, description, id) || '';
          break;
        case GeometryType.MULTI_LINE_STRING:
        case GeometryType.POLYGON:
          geometry = /** @type {Polygon} */ (geometry);
          var coords = geometry.getCoordinates();

          if (coords.length == 1 && isRectangular(coords[0], geometry.getExtent())) {
            result = formatExtent(geometry.getExtent(), this.column_, name, description, id);
          } else {
            // Some OGC services (like GeoServer) do not support polygons that cross the antimeridian, so split the
            // geometry if it crosses. Ensure the geometry has been interpolated so it is split properly.
            beginTempInterpolation(EPSG4326);
            interpolateGeom(geometry);
            endTempInterpolation();

            geometry = splitWithinWorldExtent(geometry, EPSG4326);

            result = formatGMLIntersection(geometry, this.column_, name, description, id) || '';
          }
          break;
        case GeometryType.LINE_STRING:
        case GeometryType.MULTI_POLYGON:
          result = formatGMLIntersection(geometry, this.column_, name, description, id) || '';
          break;
        default:
          result = formatExtent(geometry.getExtent(), this.column_, name, description, id);
          break;
      }
    }

    return result;
  }

  /**
   * @param {?ol.Feature} feature
   * @return {null|ol.geom.Geometry|undefined}
   * @protected
   */
  getGeometry(feature) {
    return feature ? feature.getGeometry() : null;
  }

  /**
   * Sets the column for the spatial region.
   *
   * @param {?string} value
   */
  setColumn(value) {
    this.column_ = value || defaultColumn;
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
    return value ? '<Or>' + value + '</Or>' : '';
  }
}

/**
 * The default spatial column.
 * @type {string}
 */
const defaultColumn = 'GEOM';

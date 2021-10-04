goog.declareModuleId('os.filter.impl.ecql.AreaFormatter');

import {normalizeGeometryCoordinates} from '../../../geo/geo.js';
import {ORIGINAL_GEOM_FIELD} from '../../../interpolate.js';
import FilterFormatter from './filterformatter.js';

const WKT = goog.require('ol.format.WKT');

const {default: ISpatialFormatter} = goog.requireType('os.filter.ISpatialFormatter');


/**
 * @implements {ISpatialFormatter}
 */
export default class AreaFormatter {
  /**
   * Constructor.
   * @param {string=} opt_column The geometry column name
   */
  constructor(opt_column) {
    /**
     * @type {string}
     * @protected
     */
    this.column = opt_column || 'geometry';

    /**
     * @type {WKT}
     * @protected
     */
    this.wkt = new WKT();

    /**
     * @type {string}
     * @protected
     */
    this.spatialPredicate = 'INTERSECTS';

    /**
     * @type {string}
     * @protected
     */
    this.group = 'OR';

    /**
     * @type {boolean}
     * @protected
     */
    this.supportsAltitude = true;
  }

  /**
   * @return {boolean}
   */
  getSupportsAltitude() {
    return this.supportsAltitude;
  }

  /**
   * @param {boolean} value
   */
  setSupportsAltitude(value) {
    this.supportsAltitude = value;
  }

  /**
   * @inheritDoc
   */
  format(feature) {
    var result = '';
    var geom = /** @type {ol.geom.Geometry} */ (feature.get(ORIGINAL_GEOM_FIELD)) || feature.getGeometry();

    if (geom) {
      geom = geom.clone().toLonLat();
      normalizeGeometryCoordinates(geom);

      if (!this.supportsAltitude) {
        var poly = /** @type {ol.geom.MultiPolygon|ol.geom.Polygon} */ (geom);

        var coords = poly.getCoordinates();
        AreaFormatter.stripAltitude(coords);
        poly.setCoordinates(coords);
      }

      result += '(' + this.spatialPredicate + '(' + this.column + ',' + this.wkt.writeGeometry(geom) + '))';
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
    return value ? FilterFormatter.wrapGeneric(value, this.group) : '';
  }

  /**
   * @param {Array} coords The array of coords, rings, or polygons
   */
  static stripAltitude(coords) {
    if (coords[0].length === undefined) {
      coords.length = 2;
    } else {
      coords.forEach(AreaFormatter.stripAltitude);
    }
  }
}

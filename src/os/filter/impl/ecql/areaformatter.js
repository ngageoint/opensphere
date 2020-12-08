goog.module('os.filter.impl.ecql.AreaFormatter');
goog.module.declareLegacyNamespace();

const geo = goog.require('os.geo');
const WKT = goog.require('ol.format.WKT');
const FilterFormatter = goog.require('os.filter.impl.ecql.FilterFormatter');
const interpolate = goog.require('os.interpolate');

const ISpatialFormatter = goog.requireType('os.filter.ISpatialFormatter');


/**
 * @implements {ISpatialFormatter}
 */
class AreaFormatter {
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
    var geom = /** @type {ol.geom.Geometry} */ (feature.get(interpolate.ORIGINAL_GEOM_FIELD)) || feature.getGeometry();

    if (geom) {
      geom = geom.clone().toLonLat();
      geo.normalizeGeometryCoordinates(geom);

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

exports = AreaFormatter;

goog.provide('os.filter.impl.ecql.AreaFormatter');

goog.require('ol.format.WKT');
goog.require('os.filter.ISpatialFormatter');
goog.require('os.filter.impl.ecql.FilterFormatter');
goog.require('os.geo');
goog.require('os.interpolate');


/**
 * @param {string=} opt_column The geometry column name
 * @implements {os.filter.ISpatialFormatter}
 * @constructor
 */
os.filter.impl.ecql.AreaFormatter = function(opt_column) {
  /**
   * @type {string}
   * @protected
   */
  this.column = opt_column || 'geometry';

  /**
   * @type {ol.format.WKT}
   * @protected
   */
  this.wkt = new ol.format.WKT();

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
};


/**
 * @return {boolean}
 */
os.filter.impl.ecql.AreaFormatter.prototype.getSupportsAltitude = function() {
  return this.supportsAltitude;
};


/**
 * @param {boolean} value
 */
os.filter.impl.ecql.AreaFormatter.prototype.setSupportsAltitude = function(value) {
  this.supportsAltitude = value;
};


/**
 * @param {Array} coords The array of coords, rings, or polygons
 */
os.filter.impl.ecql.AreaFormatter.stripAltitude = function(coords) {
  if (coords[0].length === undefined) {
    coords.length = 2;
  } else {
    coords.forEach(os.filter.impl.ecql.AreaFormatter.stripAltitude);
  }
};


/**
 * @inheritDoc
 */
os.filter.impl.ecql.AreaFormatter.prototype.format = function(feature) {
  var result = '';
  var geom = /** @type {ol.geom.Geometry} */ (feature.get(os.interpolate.ORIGINAL_GEOM_FIELD)) || feature.getGeometry();

  if (geom) {
    geom = geom.clone().toLonLat();
    os.geo.normalizeGeometryCoordinates(geom);

    if (!this.supportsAltitude) {
      var poly = /** @type {ol.geom.MultiPolygon|ol.geom.Polygon} */ (geom);

      var coords = poly.getCoordinates();
      os.filter.impl.ecql.AreaFormatter.stripAltitude(coords);
      poly.setCoordinates(coords);
    }

    result += '(' + this.spatialPredicate + '(' + this.column + ',' + this.wkt.writeGeometry(geom) + '))';
  }

  return result;
};


/**
 * @inheritDoc
 */
os.filter.impl.ecql.AreaFormatter.prototype.supportsMultiple = function() {
  return true;
};


/**
 * @inheritDoc
 */
os.filter.impl.ecql.AreaFormatter.prototype.wrapMultiple = function(value) {
  return value ? os.filter.impl.ecql.FilterFormatter.wrapGeneric(value, this.group) : '';
};

goog.provide('plugin.ogc.query.OGCSpatialFormatter');
goog.require('ol.geom.GeometryType');
goog.require('ol.geom.LineString');
goog.require('os.geo');
goog.require('os.geo2');
goog.require('os.ogc.filter.OGCSpatialFormatter');

/**
 * @param {string=} opt_column
 * @extends {os.ogc.filter.OGCSpatialFormatter}
 * @constructor
 */
plugin.ogc.query.OGCSpatialFormatter = function(opt_column) {
  plugin.ogc.query.OGCSpatialFormatter.base(this, 'constructor', opt_column);
};
goog.inherits(plugin.ogc.query.OGCSpatialFormatter, os.ogc.filter.OGCSpatialFormatter);


/**
 * @inheritDoc
 */
plugin.ogc.query.OGCSpatialFormatter.prototype.getGeometry = function(feature) {
  var geom = /** @type {ol.geom.Geometry} */ (feature.get(os.interpolate.ORIGINAL_GEOM_FIELD)) || feature.getGeometry();

  if (geom) {
    geom = geom.clone().toLonLat();
    var target = undefined;
    var type = geom.getType();

    if ((type === ol.geom.GeometryType.POLYGON || type === ol.geom.GeometryType.MULTI_POLYGON)
        && os.geo.crossesDateLine(geom)) {
      var antimeridian = geom.getExtent()[0] >= -180 ? 180 : -180;
      geom = os.geo.jsts.splitPolygonByLine(/** @type {ol.geom.Polygon|ol.geom.MultiPolygon} */ (geom),
          new ol.geom.LineString([[antimeridian, -90], [antimeridian, 90]]));
      target = 0;
    }

    os.geo2.normalizeGeometryCoordinates(geom, target, os.proj.EPSG4326);
  }

  return geom;
};

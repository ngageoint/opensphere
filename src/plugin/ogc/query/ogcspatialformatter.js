goog.provide('plugin.ogc.query.OGCSpatialFormatter');
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
  // Use the interpolated geometry, in case modifications need to be made (like splitting on the antimeridian).
  var geom = feature.getGeometry();

  if (geom) {
    geom = geom.clone().toLonLat();
  }

  return geom;
};

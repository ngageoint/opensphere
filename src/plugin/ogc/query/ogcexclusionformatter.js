goog.provide('plugin.ogc.query.OGCExclusionFormatter');
goog.require('os.ogc.filter.OGCExclusionFormatter');



/**
 * @param {string=} opt_column
 * @extends {os.ogc.filter.OGCExclusionFormatter}
 * @constructor
 */
plugin.ogc.query.OGCExclusionFormatter = function(opt_column) {
  plugin.ogc.query.OGCExclusionFormatter.base(this, 'constructor', opt_column);
};
goog.inherits(plugin.ogc.query.OGCExclusionFormatter, os.ogc.filter.OGCExclusionFormatter);


/**
 * @inheritDoc
 */
plugin.ogc.query.OGCExclusionFormatter.prototype.getGeometry = function(feature) {
  var geom = /** @type {ol.geom.Geometry} */ (feature.get(os.interpolate.ORIGINAL_GEOM_FIELD)) || feature.getGeometry();

  if (geom) {
    geom = geom.clone().toLonLat();
  }

  return geom;
};

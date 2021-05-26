goog.module('plugin.ogc.query.OGCSpatialFormatter');
goog.module.declareLegacyNamespace();

const OSOGCSpatialFormatter = goog.require('os.ogc.filter.OGCSpatialFormatter');

const Geometry = goog.requireType('ol.geom.Geometry');


/**
 * OGC spatial formatter that converts the geometry to EPSG:4326.
 */
class OGCSpatialFormatter extends OSOGCSpatialFormatter {
  /**
   * Constructor.
   * @param {string=} opt_column
   */
  constructor(opt_column) {
    super(opt_column);
  }

  /**
   * @inheritDoc
   */
  getGeometry(feature) {
    var geom = /** @type {Geometry} */ (feature.get(os.interpolate.ORIGINAL_GEOM_FIELD)) || feature.getGeometry();

    if (geom) {
      geom = geom.clone().toLonLat();
    }

    return geom;
  }
}

exports = OGCSpatialFormatter;

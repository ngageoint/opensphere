goog.module('plugin.ogc.query.OGCExclusionFormatter');
goog.module.declareLegacyNamespace();

const interpolate = goog.require('os.interpolate');
const OSOGCExclusionFormatter = goog.require('os.ogc.filter.OGCExclusionFormatter');

const Geometry = goog.requireType('ol.geom.Geometry');


/**
 * OGC exclusion formatter that converts the geometry to EPSG:4326.
 */
class OGCExclusionFormatter extends OSOGCExclusionFormatter {
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
    var geom = /** @type {Geometry} */ (feature.get(interpolate.ORIGINAL_GEOM_FIELD)) || feature.getGeometry();

    if (geom) {
      geom = geom.clone().toLonLat();
    }

    return geom;
  }
}

exports = OGCExclusionFormatter;

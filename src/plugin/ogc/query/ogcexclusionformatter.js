goog.declareModuleId('plugin.ogc.query.OGCExclusionFormatter');

import * as interpolate from '../../../os/interpolate.js';
import OSOGCExclusionFormatter from '../../../os/ogc/filter/ogcexclusionformatter.js';


/**
 * OGC exclusion formatter that converts the geometry to EPSG:4326.
 */
export default class OGCExclusionFormatter extends OSOGCExclusionFormatter {
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

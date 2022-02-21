goog.declareModuleId('plugin.ogc.query.OGCSpatialFormatter');

import * as interpolate from '../../../os/interpolate.js';
import OSOGCSpatialFormatter from '../../../os/ogc/filter/ogcspatialformatter.js';

/**
 * OGC spatial formatter that converts the geometry to EPSG:4326.
 */
export default class OGCSpatialFormatter extends OSOGCSpatialFormatter {
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

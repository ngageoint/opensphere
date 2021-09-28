goog.declareModuleId('os.ui.geo.mgrs');

import {MGRS_REGEXP} from '../../geo/geo.js';


/**
 * @param {string} text
 * @return {ol.Coordinate|undefined}
 */
const mgrs = (text) => {
  const mgrs = text.replace(/\s+/g, '').toUpperCase();
  if (mgrs.match(MGRS_REGEXP)) {
    return osasm.toLonLat(mgrs);
  }
};

export default mgrs;

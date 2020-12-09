goog.module('os.ui.geo.mgrs');
goog.module.declareLegacyNamespace();

const {MGRS_REGEXP} = goog.require('os.geo');


/**
 * @param {string} text
 * @return {ol.Coordinate|undefined}
 */
exports = (text) => {
  const mgrs = text.replace(/\s+/g, '').toUpperCase();
  if (mgrs.match(MGRS_REGEXP)) {
    return osasm.toLonLat(mgrs);
  }
};

goog.module('os.ui.location.ddmFilter');
goog.module.declareLegacyNamespace();

const {toDegreesDecimalMinutes} = goog.require('os.geo');
const Module = goog.require('os.ui.Module');
const Format = goog.require('os.ui.location.Format');


/**
 * Take decimal degress format and return ddm Degrees Decimal Minutes.
 * @param {!number} latdeg
 * @param {!number} londeg
 * @return {string}
 */
const filterFn = (latdeg, londeg) => {
  return toDegreesDecimalMinutes(latdeg, false, false) + ' ' + toDegreesDecimalMinutes(londeg, true, false);
};

/**
 * The Angular filter function.
 * @return {angular.Filter}
 */
const filter = () => /** @type {angular.Filter} */ (filterFn);

/**
 * Add the directive to the os.ui module
 */
Module.filter(Format.DDM, [filter]);

exports = filterFn;

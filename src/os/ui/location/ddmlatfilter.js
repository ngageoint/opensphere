goog.module('os.ui.location.ddmLatFilter');

const {toDegreesDecimalMinutes} = goog.require('os.geo');
const Module = goog.require('os.ui.Module');


/**
 * Take decimal degress format and return ddm Degrees Decimal Minutes.
 * @param {!number} latdeg
 * @return {string}
 */
const filterFn = (latdeg) => {
  return toDegreesDecimalMinutes(latdeg, false, false);
};

/**
 * The Angular filter function.
 * @return {angular.Filter}
 */
const filter = () => /** @type {angular.Filter} */ (filterFn);

/**
 * Add the directive to the os.ui module
 */
Module.filter('ddmlat', [filter]);

exports = filterFn;

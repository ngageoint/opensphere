goog.module('os.ui.location.ddmLonFilter');

const {toDegreesDecimalMinutes} = goog.require('os.geo');
const Module = goog.require('os.ui.Module');


/**
 * Take decimal degress format and return ddm Degrees Decimal Minutes.
 * @param {!number} londeg
 * @return {string}
 */
const filterFn = (londeg) => {
  return toDegreesDecimalMinutes(londeg, true, false);
};

/**
 * The Angular filter function.
 * @return {angular.Filter}
 */
const filter = () => /** @type {angular.Filter} */ (filterFn);

/**
 * Add the directive to the os.ui module
 */
Module.filter('ddmlon', [filter]);

exports = filterFn;

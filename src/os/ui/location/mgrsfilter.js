goog.module('os.ui.location.mgrsFilter');

const Module = goog.require('os.ui.Module');
const Format = goog.require('os.ui.location.Format');


/**
 * Take decimal degress format and return mgrs.
 * @param {!number} latdeg
 * @param {!number} londeg
 * @return {string}
 */
const filterFn = (latdeg, londeg) => {
  return osasm.toMGRS([londeg, latdeg]);
};

/**
 * The Angular filter function.
 * @return {angular.Filter}
 */
const filter = () => /** @type {angular.Filter} */ (filterFn);

/**
 * Add the directive to the os.ui module
 */
Module.filter(Format.MGRS, [filter]);

exports = filterFn;

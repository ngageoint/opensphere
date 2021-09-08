goog.module('os.ui.location.dmsFilter');

const {toSexagesimal} = goog.require('os.geo');
const Module = goog.require('os.ui.Module');
const Format = goog.require('os.ui.location.Format');


/**
 * Take decimal degress format and return dms Sexagesimal.
 * @param {!number} latdeg
 * @param {!number} londeg
 * @return {string}
 */
const filterFn = (latdeg, londeg) => {
  return toSexagesimal(latdeg, false, false) + ' ' + toSexagesimal(londeg, true, false);
};

/**
 * The Angular filter function.
 * @return {angular.Filter}
 */
const filter = () => /** @type {angular.Filter} */ (filterFn);

/**
 * Add the directive to the os.ui module
 */
Module.filter(Format.DMS, [filter]);

exports = filterFn;

goog.module('os.ui.location.degFilter');

const Module = goog.require('os.ui.Module');
const Format = goog.require('os.ui.location.Format');


/**
 * Take decimal degress and return formatted degrees.
 * @param {!number} latdeg
 * @param {!number} londeg
 * @return {string}
 */
const filterFn = (latdeg, londeg) => {
  if (latdeg != null && londeg != null) {
    return latdeg.toFixed(5) + '°  ' + londeg.toFixed(5) + '°';
  }
  return '';
};

/**
 * The Angular filter function.
 * @return {angular.Filter}
 */
const filter = () => /** @type {angular.Filter} */ (filterFn);

/**
 * Add the directive to the os.ui module
 */
Module.filter(Format.DEG, [filter]);

exports = filterFn;

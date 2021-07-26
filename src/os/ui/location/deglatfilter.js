goog.module('os.ui.location.degLatFilter');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');


/**
 * Take decimal degress and return formatted degrees.
 * @param {!number} latdeg
 * @return {string}
 */
const filterFn = (latdeg) => {
  return latdeg + '°';
};

/**
 * The Angular filter function.
 * @return {angular.Filter}
 */
const filter = () => /** @type {angular.Filter} */ (filterFn);

/**
 * Add the directive to the os.ui module
 */
Module.filter('deglat', [filter]);

exports = filterFn;

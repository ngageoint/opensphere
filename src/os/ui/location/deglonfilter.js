goog.module('os.ui.location.degLonFilter');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');


/**
 * Take decimal degress and return formatted degrees.
 * @param {!number} londeg
 * @return {string}
 */
const filterFn = (londeg) => {
  return londeg + '°';
};

/**
 * The Angular filter function.
 * @return {angular.Filter}
 */
const filter = () => /** @type {angular.Filter} */ (filterFn);

/**
 * Add the directive to the os.ui module
 */
Module.filter('deglon', [filter]);

exports = filterFn;

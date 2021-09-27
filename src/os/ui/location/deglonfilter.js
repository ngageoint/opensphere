goog.declareModuleId('os.ui.location.degLonFilter');

import Module from '../module.js';


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

export default filterFn;

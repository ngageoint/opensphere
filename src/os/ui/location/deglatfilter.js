goog.declareModuleId('os.ui.location.degLatFilter');

import Module from '../module.js';


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

export default filterFn;

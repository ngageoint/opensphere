goog.declareModuleId('os.ui.location.dmsLonFilter');

import Module from '../module.js';

const {toSexagesimal} = goog.require('os.geo');


/**
 * Take decimal degress format and return dms Sexagesimal.
 * @param {!number} londeg
 * @return {string}
 */
const filterFn = (londeg) => {
  return toSexagesimal(londeg, true, false);
};

/**
 * The Angular filter function.
 * @return {angular.Filter}
 */
const filter = () => /** @type {angular.Filter} */ (filterFn);

/**
 * Add the directive to the os.ui module
 */
Module.filter('dmslon', [filter]);

export default filterFn;

goog.declareModuleId('os.ui.location.ddmLatFilter');

import Module from '../module.js';

const {toDegreesDecimalMinutes} = goog.require('os.geo');


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

export default filterFn;

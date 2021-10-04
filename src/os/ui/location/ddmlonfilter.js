goog.declareModuleId('os.ui.location.ddmLonFilter');

import {toDegreesDecimalMinutes} from '../../geo/geo.js';
import Module from '../module.js';


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

export default filterFn;

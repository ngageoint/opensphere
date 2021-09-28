goog.declareModuleId('os.ui.location.ddmFilter');

import {toDegreesDecimalMinutes} from '../../geo/geo.js';
import Module from '../module.js';
import Format from './locationformat.js';


/**
 * Take decimal degress format and return ddm Degrees Decimal Minutes.
 * @param {!number} latdeg
 * @param {!number} londeg
 * @return {string}
 */
const filterFn = (latdeg, londeg) => {
  return toDegreesDecimalMinutes(latdeg, false, false) + ' ' + toDegreesDecimalMinutes(londeg, true, false);
};

/**
 * The Angular filter function.
 * @return {angular.Filter}
 */
const filter = () => /** @type {angular.Filter} */ (filterFn);

/**
 * Add the directive to the os.ui module
 */
Module.filter(Format.DDM, [filter]);

export default filterFn;

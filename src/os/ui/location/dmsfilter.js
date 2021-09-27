goog.declareModuleId('os.ui.location.dmsFilter');

import Module from '../module.js';
import Format from './locationformat.js';

const {toSexagesimal} = goog.require('os.geo');


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

export default filterFn;

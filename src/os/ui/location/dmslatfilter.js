goog.declareModuleId('os.ui.location.dmsLatFilter');

import Module from '../module.js';

const {toSexagesimal} = goog.require('os.geo');


/**
 * Take decimal degress format and return dms Sexagesimal.
 * @param {!number} latdeg
 * @return {string}
 */
const filterFn = (latdeg) => {
  return toSexagesimal(latdeg, false, false);
};

/**
 * The Angular filter function.
 * @return {angular.Filter}
 */
const filter = () => /** @type {angular.Filter} */ (filterFn);

/**
 * Add the directive to the os.ui module
 */
Module.filter('dmslat', [filter]);

export default filterFn;

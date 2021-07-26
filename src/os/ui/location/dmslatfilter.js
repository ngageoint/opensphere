goog.module('os.ui.location.dmsLatFilter');
goog.module.declareLegacyNamespace();

const {toSexagesimal} = goog.require('os.geo');
const Module = goog.require('os.ui.Module');


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

exports = filterFn;

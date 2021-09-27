goog.declareModuleId('os.ui.util.filters.ellipsisFilter');

import Module from '../module.js';


/**
 * @param {?string} text
 * @param {number=} opt_maxLength
 * @return {string}
 */
const filterFn = function(text, opt_maxLength) {
  var maxLength = opt_maxLength != null && opt_maxLength > 0 ? opt_maxLength : 100;
  var ret = text;
  if (ret.length > maxLength) {
    ret = ret.substr(0, maxLength - 3) + '&hellip;';
  }
  return ret;
};

/**
 * Take decimal degress
 * @return {angular.Filter}
 */
const ellipsisFilter = () => /** @type {angular.Filter} */ (filterFn);

/**
 * Add the filter to the os.ui module
 */
Module.filter('ellipsis', [ellipsisFilter]);

export default ellipsisFilter;

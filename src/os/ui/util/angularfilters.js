goog.provide('os.ui.util.filters.ellipsisFilter');


/**
 * Take decimal degress
 * @return {angular.Filter}
 */
os.ui.util.filters.ellipsisFilter = function() {
  return /** @type {angular.Filter} */ (os.ui.util.filters.ellipsisFilter.Filter);
};


/**
 * @param {?string} text
 * @param {number=} opt_maxLength
 * @return {string}
 */
os.ui.util.filters.ellipsisFilter.Filter = function(text, opt_maxLength) {
  var maxLength = goog.isDefAndNotNull(opt_maxLength) && opt_maxLength > 0 ? opt_maxLength : 100;
  var ret = text;
  if (ret.length > maxLength) {
    ret = ret.substr(0, maxLength - 3) + '&hellip;';
  }
  return ret;
};


/**
 * Add the filter to the os.ui module
 */
os.ui.Module.filter('ellipsis', [os.ui.util.filters.ellipsisFilter]);

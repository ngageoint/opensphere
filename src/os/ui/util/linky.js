goog.provide('os.ui.util.LinkyFilter');
goog.require('os.string');
goog.require('os.ui.Module');


/**
 * Copy of the Angular 'linky' filter.  Uses a better RegExp for linkifying (works with parentheses).  Does not
 * sanitize text.
 * @param {angular.$sanitize} $sanitize
 * @return {angular.Filter}
 * @ngInject
 */
os.ui.util.linkyFilter = function($sanitize) {
  return function(text, target) {
    return $sanitize(os.string.linkify(text, target));
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.filter('osLinky', ['$sanitize', os.ui.util.linkyFilter]);

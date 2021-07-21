goog.module('os.ui.util.LinkyFilter');
goog.module.declareLegacyNamespace();

const {linkify} = goog.require('os.string');
const Module = goog.require('os.ui.Module');

/**
 * Copy of the Angular 'linky' filter.  Uses a better RegExp for linkifying (works with parentheses).  Does not
 * sanitize text.
 *
 * @param {angular.$sanitize} $sanitize
 * @return {angular.Filter}
 * @ngInject
 */
const linkyFilter = function($sanitize) {
  return function(text, target) {
    return $sanitize(linkify(text, target));
  };
};

/**
 * Add the directive to the os.ui module
 */
Module.filter('osLinky', ['$sanitize', linkyFilter]);

exports = linkyFilter;

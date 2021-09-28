goog.declareModuleId('os.ui.util.LinkyFilter');

import {linkify} from '../../string/string.js';
import Module from '../module.js';


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

export default linkyFilter;

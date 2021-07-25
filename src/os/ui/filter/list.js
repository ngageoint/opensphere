goog.module('os.ui.filter.ListUI');
goog.module.declareLegacyNamespace();

goog.require('os.ui.filter.ColTypeListUI');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');


/**
 * The default list literal directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  templateUrl: ROOT + 'views/filter/list.html'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'fb-list';

/**
 * Add the directive to the module
 */
Module.directive('fbList', [directive]);

exports = {
  directive,
  directiveTag
};

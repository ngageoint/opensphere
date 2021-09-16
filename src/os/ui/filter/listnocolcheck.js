goog.module('os.ui.filter.ListNoColCheckUI');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');


/**
 * A directive that allows for filtering on a numeric column but including a wildcard.
 * The normal directive restricts the filter to be the same type as the column (i.e. decimal).
 * But in this case, we need to allow for a numeric along with a '*'
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  templateUrl: ROOT + 'views/filter/listnocolcheck.html'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'fb-list-no-col-check';

/**
 * Add the directive to the module
 */
Module.directive('fbListNoColCheck', [directive]);

exports = {
  directive,
  directiveTag
};

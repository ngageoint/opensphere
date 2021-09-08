goog.module('os.ui.filter.TextUI');

goog.require('os.ui.filter.colTypeCheckValidation');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');


/**
 * The default text literal directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  templateUrl: ROOT + 'views/filter/text.html'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'fb-text';

/**
 * Add the directive to the module
 */
Module.directive('fbText', [directive]);

exports = {
  directive,
  directiveTag
};

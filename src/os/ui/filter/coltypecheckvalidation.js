goog.module('os.ui.filter.colTypeCheckValidation');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');
const FilterPatterns = goog.require('os.ui.filter.FilterPatterns');


/**
 * The column type check validation
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  require: 'ngModel',
  link: colTypeCheckLink
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'coltypecheck';

/**
 * The link for type check validation
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {*} $attrs
 * @param {*} $ctrl
 * @ngInject
 */
const colTypeCheckLink = function($scope, $element, $attrs, $ctrl) {
  $ctrl.$parsers.unshift(
      /**
       * @param {string} viewValue
       * @return {string|undefined}
       */
      function(viewValue) {
        var key = $scope['expr']['column']['type'];
        var pattern = FilterPatterns[key];

        if (pattern && pattern.test(viewValue)) {
          $ctrl.$setValidity('type', true);
          $element.attr('title', '');
          return viewValue;
        } else {
          $ctrl.$setValidity('type', false);
          $element.attr('title', 'Please enter a valid ' + key);
          return undefined;
        }
      });
};

/**
 * Add directive to module
 */
Module.directive(directiveTag, [directive]);

exports = {
  directive,
  directiveTag
};

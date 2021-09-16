goog.module('os.ui.filter.colTypeCheckValidation');

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
        // try the type, but if for some reason we don't understand the type, use string which allows anything
        var key = $scope['expr']['column']['type'];
        var pattern = FilterPatterns[key] || FilterPatterns['string'];

        if (pattern && pattern.test(viewValue)) {
          $ctrl.$setValidity('type', true);
          $element.attr('title', '');
          return viewValue;
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

goog.provide('os.ui.filter.colTypeCheckValidation');
goog.provide('os.ui.filter.textDirective');

goog.require('os.ui.Module');
goog.require('os.ui.filter.FilterPatterns');


/**
 * The default text literal directive
 *
 * @return {angular.Directive}
 */
os.ui.filter.textDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/filter/text.html'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('fbText', [os.ui.filter.textDirective]);


/**
 * The column type check validation
 *
 * @return {angular.Directive}
 */
os.ui.filter.colTypeCheckValidation = function() {
  return {
    require: 'ngModel',
    link: os.ui.filter.colTypeCheckLink
  };
};


/**
 * The link for type check validation
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {*} $attrs
 * @param {*} $ctrl
 * @ngInject
 */
os.ui.filter.colTypeCheckLink = function($scope, $element, $attrs, $ctrl) {
  $ctrl.$parsers.unshift(
      /**
       * @param {string} viewValue
       * @return {string|undefined}
       */
      function(viewValue) {
        var key = $scope['expr']['column']['type'];
        var pattern = os.ui.filter.FilterPatterns[key];

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
os.ui.Module.directive('coltypecheck', [os.ui.filter.colTypeCheckValidation]);

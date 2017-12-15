goog.provide('os.ui.RightClickCtrl');
goog.provide('os.ui.ngRightClickDirective');

goog.require('os.ui.Module');


/**
 * @return {angular.Directive}
 */
os.ui.ngRightClickDirective = function() {
  return {
    restrict: 'A',
    controller: os.ui.RightClickCtrl
  };
};


os.ui.Module.directive('ngRightClick', [os.ui.ngRightClickDirective]);



/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$parse} $parse
 * @param {!angular.Attributes} $attrs
 * @ngInject
 * @constructor
 */
os.ui.RightClickCtrl = function($scope, $element, $parse, $attrs) {
  var handler = $parse($attrs['ngRightClick']);
  $element.bind('contextmenu', function(evt) {
    $scope.$apply(function() {
      evt.preventDefault();
      evt.stopPropagation();
      handler($scope, {'$event': evt});
    });
  });
};

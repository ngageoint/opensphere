goog.provide('os.annotation.annotationOptionsDirective');

goog.require('os.ui.Module');


/**
 * An annotation to attach to the map.
 *
 * @return {angular.Directive}
 */
os.annotation.annotationOptionsDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/annotation/annotationoptions.html'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('annotationoptions', [os.annotation.annotationOptionsDirective]);

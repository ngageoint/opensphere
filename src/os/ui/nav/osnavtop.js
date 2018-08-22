goog.provide('os.ui.osNavTopDirective');

goog.require('os.defines');


/**
 * The OpenSphere top nav bar.
 * @return {angular.Directive}
 */
os.ui.osNavTopDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/osnavtop.html'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('osNavTop', [os.ui.osNavTopDirective]);

goog.provide('os.ui.navBottomDirective');

goog.require('os.defines');
goog.require('os.ui.NavBarCtrl');


/**
 * The nav-bottom directive
 * @return {angular.Directive}
 */
os.ui.navBottomDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/navbottom.html',
    controller: os.ui.NavBarCtrl,
    controllerAs: 'navBottom'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('navBottom', [os.ui.navBottomDirective]);

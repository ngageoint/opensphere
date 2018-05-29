goog.provide('os.ui.navTopDirective');

goog.require('os.defines');
goog.require('os.ui.NavBarCtrl');
goog.require('os.ui.util.buttonHeightDirective');


/**
 * The nav-top directive
 * @return {angular.Directive}
 */
os.ui.navTopDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'bgTransparent': '@?',
      'brand': '=?'
    },
    templateUrl: os.ROOT + 'views/navtop.html',
    controller: os.ui.NavBarCtrl,
    controllerAs: 'navTop'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('navTop', [os.ui.navTopDirective]);

goog.provide('os.ui.navBottomDirective');

goog.require('os.defines');
goog.require('os.ui.NavBarCtrl');
goog.require('os.ui.alert.alertButtonDirective');
goog.require('os.ui.list');
goog.require('os.ui.muteButtonDirective');
goog.require('os.ui.nav');
goog.require('os.ui.scaleLineDirective');
goog.require('os.ui.serversButtonDirective');


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

os.ui.list.add(os.ui.nav.Location.BOTTOM_LEFT, '<li id="zoom-level"></li>', 100);
os.ui.list.add(os.ui.nav.Location.BOTTOM_LEFT, 'scale-line', 200);
os.ui.list.add(os.ui.nav.Location.BOTTOM_LEFT, '<li id="mouse-position"></li>', 300);

os.ui.list.add(os.ui.nav.Location.BOTTOM_RIGHT, 'servers-button', 100);
os.ui.list.add(os.ui.nav.Location.BOTTOM_RIGHT, 'alert-button', 200);
os.ui.list.add(os.ui.nav.Location.BOTTOM_RIGHT, 'mute-button', 300);

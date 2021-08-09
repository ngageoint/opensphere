goog.module('os.ui.navBottomDirective');
goog.module.declareLegacyNamespace();

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const NavBarCtrl = goog.require('os.ui.NavBarCtrl');


/**
 * The nav-bottom directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/navbottom.html',
  controller: NavBarCtrl,
  controllerAs: 'navBottom'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'nav-bottom';

/**
 * Add the directive to the module.
 */
Module.directive('navBottom', [directive]);

exports = {
  directive,
  directiveTag
};

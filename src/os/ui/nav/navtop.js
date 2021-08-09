goog.module('os.ui.navTopDirective');
goog.module.declareLegacyNamespace();

goog.require('os.ui.util.PunyParentUI');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const NavBarCtrl = goog.require('os.ui.NavBarCtrl');


/**
 * The nav-top directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'options': '=?'
  },
  templateUrl: ROOT + 'views/navtop.html',
  controller: NavBarCtrl,
  controllerAs: 'navTop'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'nav-top';

/**
 * Add the directive to the module.
 */
Module.directive('navTop', [directive]);

exports = {
  directive,
  directiveTag
};

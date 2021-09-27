goog.declareModuleId('os.ui.navBottomDirective');

import {ROOT} from '../../os.js';
import Module from '../module.js';
import NavBarCtrl from './navbarctrl.js';


/**
 * The nav-bottom directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
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
export const directiveTag = 'nav-bottom';

/**
 * Add the directive to the module.
 */
Module.directive('navBottom', [directive]);

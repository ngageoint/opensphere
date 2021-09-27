goog.declareModuleId('os.ui.navTopDirective');

import '../util/punyparent.js';
import {ROOT} from '../../os.js';
import Module from '../module.js';
import NavBarCtrl from './navbarctrl.js';


/**
 * The nav-top directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
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
export const directiveTag = 'nav-top';

/**
 * Add the directive to the module.
 */
Module.directive('navTop', [directive]);

goog.declareModuleId('os.ui.OSNavTopUI');

import {ROOT} from '../../os.js';
import Module from '../module.js';


/**
 * The OpenSphere top nav bar.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/osnavtop.html'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'os-nav-top';

/**
 * Add the directive to the module.
 */
Module.directive('osNavTop', [directive]);

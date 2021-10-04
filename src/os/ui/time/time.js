goog.declareModuleId('os.ui.time.timeDirective');

import {ROOT} from '../../os.js';
import Module from '../module.js';


/**
 * The time directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'hours': '=',
    'mins': '=',
    'secs': '=',
    'isRequired': '=?'
  },
  templateUrl: ROOT + 'views/time/time.html',
  controllerAs: 'time'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'time';

/**
 * Add the directive to the module.
 */
Module.directive('time', [directive]);

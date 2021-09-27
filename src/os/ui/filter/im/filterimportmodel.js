goog.declareModuleId('os.ui.filter.im.FilterImportModelUI');

import {ROOT} from '../../../os.js';
import Module from '../../module.js';


/**
 * The filterimportmodel directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  // this directive needs to be replace: false to display properly as it is recursive
  replace: false,
  scope: {
    'layerSelected': '=',
    'models': '=',
    'icon': '=',
    'found': '=',
    'isChild': '=?'
  },
  templateUrl: ROOT + 'views/filter/im/filterimportmodel.html'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'filterimportmodel';

/**
 * Add the directive to the module.
 */
Module.directive('filterimportmodel', [directive]);

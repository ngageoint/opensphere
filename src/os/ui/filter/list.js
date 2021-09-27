goog.declareModuleId('os.ui.filter.ListUI');

import './coltypelistui.js';
import {ROOT} from '../../os.js';
import Module from '../module.js';


/**
 * The default list literal directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  templateUrl: ROOT + 'views/filter/list.html'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'fb-list';

/**
 * Add the directive to the module
 */
Module.directive('fbList', [directive]);

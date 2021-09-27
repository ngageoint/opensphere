goog.declareModuleId('os.ui.column.columnRowDirective');

import {ROOT} from '../../os.js';
import Module from '../module.js';


/**
 * The columnrow directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'item': '='
  },
  templateUrl: ROOT + 'views/column/columnrow.html'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'columnrow';


/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

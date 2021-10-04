goog.declareModuleId('os.ui.filter.TextUI');

import './coltypecheckvalidation.js';
import {ROOT} from '../../os.js';
import Module from '../module.js';


/**
 * The default text literal directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  templateUrl: ROOT + 'views/filter/text.html'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'fb-text';

/**
 * Add the directive to the module
 */
Module.directive('fbText', [directive]);

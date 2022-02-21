goog.declareModuleId('plugin.arc.ArcImportForm');

import {ROOT} from '../../os/os.js';
import Module from '../../os/ui/module.js';
import {directive as arcServerDirective} from './arcserverimport.js';


/**
 * A dialog with information about custom date/time formats, as implemented by Moment.js.
 *
 * @return {angular.Directive}
 */
export const directive = () => {
  const original = arcServerDirective();
  original.templateUrl = ROOT + 'views/forms/singleurlform.html';
  return original;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'arcserverform';


/**
 * Add the directive to the os module
 */
Module.directive(directiveTag, [directive]);

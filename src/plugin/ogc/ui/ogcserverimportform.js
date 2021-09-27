goog.declareModuleId('plugin.ogc.ui.OgcServerImportForm');

import {ROOT} from '../../../os/os.js';
import Module from '../../../os/ui/module.js';
import {directive as ogcServerDirective} from './ogcserverimport.js';



/**
 * A dialog with information about custom date/time formats, as implemented by Moment.js.
 *
 * @return {angular.Directive}
 */
export const directive = () => {
  const original = ogcServerDirective();
  original.templateUrl = ROOT + 'views/plugin/ogc/ui/ogcserverimportform.html';
  return original;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'ogcserverform';


/**
 * Add the directive to the os module
 */
Module.directive(directiveTag, [directive]);

goog.declareModuleId('plugin.ogc.ui.GeoserverImportForm');

import {ROOT} from '../../../os/os.js';
import {directive as geoserverDirective} from './geoserverimport.js';

const Module = goog.require('os.ui.Module');



/**
 * A dialog with information about custom date/time formats, as implemented by Moment.js.
 *
 * @return {angular.Directive}
 */
export const directive = () => {
  const original = geoserverDirective();
  original.templateUrl = ROOT + 'views/forms/singleurlform.html';
  return original;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'geoserverform';


/**
 * Add the directive to the os module
 */
Module.directive(directiveTag, [directive]);

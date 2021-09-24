goog.declareModuleId('plugin.xyz.XYZImportForm');

import {ROOT} from '../../os/os.js';
import {directive as xyzImportDirective} from './xyzproviderimport.js';

const Module = goog.require('os.ui.Module');

/**
 * A derivative of the XYZImport directive with the only difference being the templateUrl.
 *
 * @return {angular.Directive}
 */
export const directive = () => {
  const original = xyzImportDirective();
  original.templateUrl = ROOT + 'views/plugin/xyz/xyzsingleurlform.html';
  return original;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'xyzproviderform';


/**
 * Add the directive to the os module
 */
Module.directive(directiveTag, [directive]);

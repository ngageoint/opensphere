goog.declareModuleId('plugin.arc.ArcServerHelpUI');

import {ROOT} from '../../os/os.js';

const Module = goog.require('os.ui.Module');
const {directive: baseDirective} = goog.require('os.ui.window.BaseWindowUI');


/**
 * Provides help adding an ArcGIS server to the application.
 *
 * @return {angular.Directive}
 */
export const directive = () => {
  const directive = baseDirective();
  directive.templateUrl = ROOT + 'views/plugin/arc/arcserverhelp.html';
  return directive;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'arcserverhelp';

/**
 * Add the directive to the os module
 */
Module.directive(directiveTag, [directive]);

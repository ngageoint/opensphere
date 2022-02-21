goog.declareModuleId('plugin.arc.ArcServerHelpUI');

import {ROOT} from '../../os/os.js';
import Module from '../../os/ui/module.js';
import {directive as baseDirective} from '../../os/ui/window/basewindowui.js';


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

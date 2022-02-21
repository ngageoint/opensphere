goog.declareModuleId('plugin.im.action.feature.ui.legendSettingsDirective');

import {ROOT} from '../../../os/os.js';
import Module from '../../../os/ui/module.js';


/**
 * The featureactionlegendsettings directive.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/plugin/featureaction/featureactionlegendsettings.html'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'featureactionlegendsettings';

/**
 * Add the directive to the module.
 */
Module.directive('featureactionlegendsettings', [directive]);

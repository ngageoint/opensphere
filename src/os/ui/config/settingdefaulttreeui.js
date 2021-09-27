goog.declareModuleId('os.ui.config.SettingDefaultUI');

import Module from '../module.js';


/**
 * The selected/highlighted node UI directive for filter groups
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: '<div></div>'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'defaultsettingui';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

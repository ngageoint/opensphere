goog.module('os.ui.config.SettingDefaultUI');

const Module = goog.require('os.ui.Module');


/**
 * The selected/highlighted node UI directive for filter groups
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: '<div></div>'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'defaultsettingui';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

exports = {
  directive,
  directiveTag
};

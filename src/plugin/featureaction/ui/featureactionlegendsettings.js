goog.module('plugin.im.action.feature.ui.legendSettingsDirective');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');


/**
 * The featureactionlegendsettings directive.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/plugin/featureaction/featureactionlegendsettings.html'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'featureactionlegendsettings';

/**
 * Add the directive to the module.
 */
Module.directive('featureactionlegendsettings', [directive]);

exports = {
  directive,
  directiveTag
};

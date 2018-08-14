goog.provide('plugin.im.action.feature.ui.LegendSettingsCtrl');
goog.provide('plugin.im.action.feature.ui.legendSettingsDirective');

goog.require('os.ui.Module');


/**
 * The featureactionlegendsettings directive.
 * @return {angular.Directive}
 */
plugin.im.action.feature.ui.legendSettingsDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/plugin/featureaction/featureactionlegendsettings.html'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('featureactionlegendsettings', [plugin.im.action.feature.ui.legendSettingsDirective]);

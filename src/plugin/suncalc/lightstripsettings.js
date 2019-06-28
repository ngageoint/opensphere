goog.provide('plugin.suncalc.LightStripSettings');
goog.provide('plugin.suncalc.LightStripSettingsCtrl');
goog.provide('plugin.suncalc.LightStripSettingsDirective');

goog.require('goog.async.Delay');
goog.require('os.map');
goog.require('os.ui.Module');
goog.require('os.ui.config.SettingPlugin');


/**
 * @extends {os.ui.config.SettingPlugin}
 * @constructor
 */
plugin.suncalc.LightStripSettings = function() {
  plugin.suncalc.LightStripSettings.base(this, 'constructor');

  this.setLabel('Light Strip');
  this.setCategories(['Map']);
  this.setDescription('Twilight calculation settings');
  this.setTags(['twilight', 'lightstrip']);
  this.setIcon('fa fa-sun-o');
  this.setUI('lightstripsettings');
};
goog.inherits(plugin.suncalc.LightStripSettings, os.ui.config.SettingPlugin);


/**
 * The lightstrip settings UI directive
 *
 * @return {angular.Directive}
 */
plugin.suncalc.LightStripSettingsDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/plugin/suncalc/lightstripsettings.html',
    controller: plugin.suncalc.LightStripSettingsCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('lightstripsettings', [plugin.suncalc.LightStripSettingsDirective]);


/**
 * Controller for Light Strip Controller settings
 *
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
plugin.suncalc.LightStripSettingsCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  this.scope_.$on('$destroy', this.destroy_.bind(this));

  this['twilightCalculation'] = /** @type {string} */ (os.settings.get(plugin.suncalc.SettingKey.DUSK_MODE,
      plugin.suncalc.duskMode.ASTRONOMICAL
  ));

  this.scope_.$watch('ctrl.twilightCalculation', this.onSettingsChanged.bind(this));
};


/**
 * @private
 */
plugin.suncalc.LightStripSettingsCtrl.prototype.destroy_ = function() {
  os.settings.unlisten(goog.events.EventType.PROPERTYCHANGE, this.onSettingsChanged, false, this);
  this.scope_ = null;
};


/**
 * @param {string=} opt_new
 * @param {string=} opt_old
 * @protected
 */
plugin.suncalc.LightStripSettingsCtrl.prototype.onSettingsChanged = function(opt_new, opt_old) {
  if (opt_new && opt_old && opt_new !== opt_old) {
    if (os.settings) {
      os.settings.set(plugin.suncalc.SettingKey.DUSK_MODE, opt_new);
    }
  }
};

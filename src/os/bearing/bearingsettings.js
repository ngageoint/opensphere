goog.provide('os.bearing.BearingSettings');
goog.provide('os.bearing.BearingSettingsCtrl');
goog.require('os.bearing');
goog.require('os.config.Settings');
goog.require('os.ui.Module');
goog.require('os.ui.config.SettingPlugin');
goog.require('os.ui.popover.popoverDirective');



/**
 * Settings plugin for controlling bearing settings. When it is instantiated, it lazy loads the geomagnetic
 * data needed for calculating magnetic north bearings.
 * @extends {os.ui.config.SettingPlugin}
 * @constructor
 */
os.bearing.BearingSettings = function() {
  os.bearing.BearingSettings.base(this, 'constructor');

  this.setLabel('Bearing');
  this.setCategories(['Map']);
  this.setDescription('Choose whether bearings are displayed with as true north or magnetic north');
  this.setTags(['bearing', 'north', 'true', 'magnetic']);
  this.setIcon('fa fa-compass');
  this.setUI('bearing-setting');

  os.bearing.loadGeomag();
};
goog.inherits(os.bearing.BearingSettings, os.ui.config.SettingPlugin);


/**
 * The bearing settings directive
 * @return {angular.Directive}
 */
os.bearing.BearingSettingsDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/config/bearingsettings.html',
    controller: os.bearing.BearingSettingsCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('bearingSetting', [os.bearing.BearingSettingsDirective]);



/**
 * Controller for bearing settings
 * @param {angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.bearing.BearingSettingsCtrl = function($scope) {
  /**
   * @type {angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  os.settings.listen(os.bearing.BearingSettingsKeys.BEARING_TYPE, this.onBearingChange_, false, this);

  /**
   * @type {string}
   */
  this['format'] = /** @type {string} */ (os.settings.get(
      os.bearing.BearingSettingsKeys.BEARING_TYPE, os.bearing.BearingType.TRUE_NORTH));

  var cofVersion = /** @type {string} */ (os.settings.get(os.bearing.BearingSettingsKeys.COF_VERSION, '2015-2020'));
  var helpUrl = /** @type {string} */ (os.settings.get(os.bearing.BearingSettingsKeys.MAGNETIC_NORTH_HELP_URL));

  this.scope_['cofVersion'] = cofVersion;
  this.scope_['helpUrl'] = helpUrl;

  this.scope_.$watch('ctrl.format', goog.bind(this.update, this));
  this.scope_.$on('$destroy', goog.bind(this.destroy_, this));
};


/**
 * Destroy
 * @private
 */
os.bearing.BearingSettingsCtrl.prototype.destroy_ = function() {
  os.settings.unlisten(os.bearing.BearingSettingsKeys.BEARING_TYPE, this.onBearingChange_, false, this);
};


/**
 * Listen for changes from the system and update the setting display
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.bearing.BearingSettingsCtrl.prototype.onBearingChange_ = function(event) {
  if (typeof event.newVal == 'string' && event.newVal !== event.oldVal) {
    this['format'] = event.newVal;
    os.ui.apply(this.scope_);
  }
};


/**
 * Update and store setting.
 * @param {os.ui.location.Format=} opt_new
 * @param {os.ui.location.Format=} opt_old
 */
os.bearing.BearingSettingsCtrl.prototype.update = function(opt_new, opt_old) {
  if (opt_new && opt_old && opt_new !== opt_old) {
    os.settings.set(os.bearing.BearingSettingsKeys.BEARING_TYPE, opt_new);
  }
};
goog.exportProperty(os.bearing.BearingSettingsCtrl.prototype, 'update',
    os.bearing.BearingSettingsCtrl.prototype.update);

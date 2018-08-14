goog.provide('os.ui.user.settings.LocationSetting');
goog.provide('os.ui.user.settings.LocationSettings');
goog.provide('os.ui.user.settings.LocationSettingsCtrl');

goog.require('goog.events.Event');
goog.require('os.config.Settings');
goog.require('os.ui.config.SettingPlugin');
goog.require('os.ui.location');
goog.require('os.ui.location.SimpleLocationControlsCtrl');



/**
 * @extends {os.ui.config.SettingPlugin}
 * @constructor
 */
os.ui.user.settings.LocationSettings = function() {
  os.ui.user.settings.LocationSettings.base(this, 'constructor');

  this.setLabel('Location Format');
  this.setDescription('Set Your Location Format');
  this.setTags(['Latitude', 'Longitude']);
  this.setIcon('fa fa-location-arrow');
  this.setUI('location-setting');
};
goog.inherits(os.ui.user.settings.LocationSettings, os.ui.config.SettingPlugin);


/**
 * The layers window directive
 * @return {angular.Directive}
 */
os.ui.user.settings.LocationSettingsDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/config/locationsettings.html',
    controller: os.ui.user.settings.LocationSettingsCtrl,
    controllerAs: 'locSet'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('locationSetting', [os.ui.user.settings.LocationSettingsDirective]);



/**
 * Controller for location settings
 * @param {angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.user.settings.LocationSettingsCtrl = function($scope) {
  /**
   * @type {angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  os.settings.listen(os.ui.location.LocationSetting.POSITION, this.onFormatChange_, false, this);

  /**
   * @type {?os.ui.location.Constant.Format}
   */
  this['format'] = /** @type {string} */ (os.settings.get(
      os.ui.location.LocationSetting.POSITION, os.ui.location.Format.DEG));

  this.scope_.$watch('locSet.format', this.update.bind(this));
  this.scope_.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Destroy
 * @private
 */
os.ui.user.settings.LocationSettingsCtrl.prototype.destroy_ = function() {
  os.settings.unlisten(os.ui.location.LocationSetting.POSITION, this.onFormatChange_, false, this);
};


/**
 * Listen for changes from the system and update the setting display
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.ui.user.settings.LocationSettingsCtrl.prototype.onFormatChange_ = function(event) {
  if (event && typeof event.newVal == 'string' && event.newVal !== event.oldVal) {
    this['format'] = event.newVal;
    os.ui.apply(this.scope_);
  }
};


/**
 * Update and store setting.
 * @param {os.ui.location.Format=} opt_new
 * @param {os.ui.location.Format=} opt_old
 */
os.ui.user.settings.LocationSettingsCtrl.prototype.update = function(opt_new, opt_old) {
  if (os.settings && opt_new && opt_old && opt_new !== opt_old) {
    os.settings.set(os.ui.location.LocationSetting.POSITION, opt_new);
  }
};
goog.exportProperty(os.ui.user.settings.LocationSettingsCtrl.prototype, 'update',
    os.ui.user.settings.LocationSettingsCtrl.prototype.update);

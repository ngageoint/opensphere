goog.provide('os.ui.config.SettingsContainerCtrl');
goog.provide('os.ui.config.SettingsContainerDirective');
goog.require('os.ui.config.AbstractSettingsCtrl');
goog.require('os.ui.config.settingsWindowDirective');


/**
 * The settings container directive
 * @return {angular.Directive}
 */
os.ui.config.settingsContainerDirective = function() {
  var dir = os.ui.config.settingsWindowDirective();
  dir.controller = os.ui.config.SettingsContainerCtrl;
  return dir;
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('settingscontainer', [os.ui.config.settingsContainerDirective]);



/**
 * Controller for the save export window
 * @param {!angular.Scope} $scope
 * @param {!angular.$timeout} $timeout
 * @param {!angular.$routeParams} $routeParams
 * @param {!angular.$location} $location
 * @extends {os.ui.config.AbstractSettingsCtrl}
 * @constructor
 * @ngInject
 */
os.ui.config.SettingsContainerCtrl = function($scope, $timeout, $routeParams, $location) {
  os.ui.config.SettingsContainerCtrl.base(this, 'constructor', $scope, $timeout);

  /**
   * @type {?angular.$location}
   * @private
   */
  this.location_ = $location;

  if ($routeParams['setting']) {
    var sm = os.ui.config.SettingsManager.getInstance();

    goog.array.some(sm.getChildren(), function(setting) {
      if ($routeParams['setting'].toLowerCase() == setting.getLabel().toLowerCase()) {
        this.scope['selected'] = setting;
        return true;
      }
      return false;
    }, this);
  }
};
goog.inherits(os.ui.config.SettingsContainerCtrl, os.ui.config.AbstractSettingsCtrl);


/**
 * @inheritDoc
 */
os.ui.config.SettingsContainerCtrl.prototype.destroy = function() {
  this.location_ = null;
};


/**
 * @inheritDoc
 */
os.ui.config.SettingsContainerCtrl.prototype.onSelected = function(newVal, oldVal) {
  if (newVal && newVal.getId) {
    var sm = os.ui.config.SettingsManager.getInstance();
    sm.setSelected(newVal);
    this.location_.search('setting', newVal.getLabel());
    this.location_.replace();
  }
};

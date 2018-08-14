goog.provide('os.ui.config.SettingsWindowCtrl');
goog.provide('os.ui.config.settingsWindowDirective');
goog.require('os.ui.config.AbstractSettingsCtrl');


/**
 * The settings window directive
 * @return {angular.Directive}
 */
os.ui.config.settingsWindowDirective = function() {
  return {
    restrict: 'E',
    templateUrl: os.ROOT + 'views/config/settingswindow.html',
    controller: os.ui.config.SettingsWindowCtrl,
    controllerAs: 'setCon'
  };
};


/**
 * Add the directive to the os.ui module
 */
os.ui.Module.directive('settings', [os.ui.config.settingsWindowDirective]);



/**
 * Controller for the save export window
 * @param {!angular.Scope} $scope
 * @param {!angular.$timeout} $timeout
 * @param {!angular.JQLite} $element
 * @extends {os.ui.config.AbstractSettingsCtrl}
 * @constructor
 * @ngInject
 */
os.ui.config.SettingsWindowCtrl = function($scope, $timeout, $element) {
  os.ui.config.SettingsWindowCtrl.base(this, 'constructor', $scope, $timeout);

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;
};
goog.inherits(os.ui.config.SettingsWindowCtrl, os.ui.config.AbstractSettingsCtrl);


/**
 * @inheritDoc
 */
os.ui.config.SettingsWindowCtrl.prototype.destroy = function() {
  this.element_ = null;
};


/**
 * Close the window
 * @private
 */
os.ui.config.SettingsWindowCtrl.prototype.close_ = function() {
  os.ui.window.close(this.element_);
};
goog.exportProperty(os.ui.config.SettingsWindowCtrl.prototype, 'close',
    os.ui.config.SettingsWindowCtrl.prototype.close_);

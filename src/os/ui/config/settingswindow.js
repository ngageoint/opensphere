goog.provide('os.ui.config.SettingsWindowCtrl');
goog.provide('os.ui.config.SettingsWindowList');
goog.provide('os.ui.config.settingsWindowDirective');
goog.require('os.ui.config.AbstractSettingsCtrl');


/**
 * The settings window directive
 *
 * @return {angular.Directive}
 */
os.ui.config.settingsWindowDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'hideClose': '@?'
    },
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
 * Settings window button list
 * @type {string}
 */
os.ui.config.SettingsWindowList = 'settings-window-button';



/**
 * Controller for the save export window
 *
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

  $scope.$on('os.ui.window.params', this.onParamsChange_.bind(this));
};
goog.inherits(os.ui.config.SettingsWindowCtrl, os.ui.config.AbstractSettingsCtrl);


/**
 * @inheritDoc
 */
os.ui.config.SettingsWindowCtrl.prototype.destroy = function() {
  this.element_ = null;
};


/**
 * Handle params change event
 *
 * @param {!angular.Scope.Event} event
 * @param {Object} params
 * @private
 */
os.ui.config.SettingsWindowCtrl.prototype.onParamsChange_ = function(event, params) {
  var settingsMgr = os.ui.config.SettingsManager.getInstance();
  var plugins = settingsMgr.getChildren();
  for (var i = 0; i < plugins.length; i++) {
    var plugin = plugins[i];
    if (params && params.length > 0 && plugin.getLabel() == params[0]) {
      settingsMgr.setSelectedPlugin(plugin.getId());
      break;
    }
  }
};


/**
 * Close the window
 *
 * @export
 */
os.ui.config.SettingsWindowCtrl.prototype.close = function() {
  os.ui.window.close(this.element_);
};

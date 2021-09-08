goog.module('os.ui.config.SettingsWindowUI');

goog.require('os.ui.config.SettingDefaultUI');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const AbstractSettingsCtrl = goog.require('os.ui.config.AbstractSettingsCtrl');
const SettingsManager = goog.require('os.ui.config.SettingsManager');
const {close} = goog.require('os.ui.window');


/**
 * The settings window directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'hideClose': '@?'
  },
  templateUrl: ROOT + 'views/config/settingswindow.html',
  controller: Controller,
  controllerAs: 'setCon'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'settings';


/**
 * Add the directive to the os.ui module
 */
Module.directive('settings', [directive]);


/**
 * Controller for the save export window
 * @unrestricted
 */
class Controller extends AbstractSettingsCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.$timeout} $timeout
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $timeout, $element) {
    super($scope, $timeout);

    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    $scope.$on('os.ui.window.params', this.onParamsChange_.bind(this));
  }

  /**
   * @inheritDoc
   */
  destroy() {
    super.destroy();

    this.element_ = null;
  }

  /**
   * Handle params change event
   *
   * @param {!angular.Scope.Event} event
   * @param {Object} params
   * @private
   */
  onParamsChange_(event, params) {
    var settingsMgr = SettingsManager.getInstance();
    var plugins = settingsMgr.getChildren();
    for (var i = 0; i < plugins.length; i++) {
      var plugin = plugins[i];
      if (params && params.length > 0 && plugin.getLabel() == params[0]) {
        settingsMgr.setSelectedPlugin(plugin.getId());
        break;
      }
    }
  }

  /**
   * Close the window
   *
   * @export
   */
  close() {
    close(this.element_);
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};

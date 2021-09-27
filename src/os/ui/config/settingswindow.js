goog.declareModuleId('os.ui.config.SettingsWindowUI');

import './settingdefaulttreeui.js';
import {ROOT} from '../../os.js';
import Module from '../module.js';
import {close} from '../window.js';
import AbstractSettingsCtrl from './abstractsettings.js';
import SettingsManager from './settingsmanager.js';


/**
 * The settings window directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
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
export const directiveTag = 'settings';


/**
 * Add the directive to the os.ui module
 */
Module.directive('settings', [directive]);


/**
 * Controller for the save export window
 * @unrestricted
 */
export class Controller extends AbstractSettingsCtrl {
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

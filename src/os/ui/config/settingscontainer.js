goog.declareModuleId('os.ui.config.SettingsContainerUI');

import Module from '../module.js';
import AbstractSettingsCtrl from './abstractsettings.js';
import SettingsManager from './settingsmanager.js';
import {directive as settingsWindowDirective} from './settingswindow.js';


/**
 * The settings container directive
 *
 * @return {angular.Directive}
 */
const directive = function() {
  const dir = settingsWindowDirective();
  dir.controller = Controller;
  return dir;
};


/**
 * Add the directive to the os.ui module
 */
Module.directive('settingscontainer', [directive]);


/**
 * Controller for the save export window
 * @unrestricted
 */
export default class Controller extends AbstractSettingsCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.$timeout} $timeout
   * @param {!angular.$routeParams} $routeParams
   * @param {!angular.$location} $location
   * @ngInject
   */
  constructor($scope, $timeout, $routeParams, $location) {
    super($scope, $timeout);

    /**
     * @type {?angular.$location}
     * @private
     */
    this.location_ = $location;

    if ($routeParams['setting']) {
      const sm = SettingsManager.getInstance();
      const children = sm.getChildren();

      children.some(function(setting) {
        if ($routeParams['setting'].toLowerCase() == setting.getLabel().toLowerCase()) {
          this.scope['selected'] = setting;
          return true;
        }
        return false;
      }, this);
    }
  }

  /**
   * @inheritDoc
   */
  destroy() {
    super.destroy();

    this.location_ = null;
  }

  /**
   * @inheritDoc
   */
  onSelected(newVal, oldVal) {
    if (newVal && newVal.getId) {
      const sm = SettingsManager.getInstance();
      sm.setSelected(newVal);
      this.location_.search('setting', newVal.getLabel());
      this.location_.replace();
    }
  }
}

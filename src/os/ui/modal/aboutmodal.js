goog.declareModuleId('os.ui.modal.AboutModalUI');

import {getAppName} from '../../config/config.js';
import Settings from '../../config/settings.js';
import {ROOT} from '../../os.js';
import Module from '../module.js';
import windowSelector from '../windowselector.js';
import {create, open} from './modal.js';


/**
 * The about modal displays the version of the browser from navigator.userAgent and the version
 * of the application from the Settings.Config.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  replace: true,
  restrict: 'E',
  templateUrl: ROOT + 'views/modal/aboutmodal.html',
  controller: Controller,
  controllerAs: 'aboutModalCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'about-modal';

/**
 * Register about-modal directive
 */
Module.directive('aboutModal', [directive]);

/**
 * Controller function for the about-modal directive.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The scope
   * @param {!angular.JQLite} $element The element
   * @ngInject
   */
  constructor($scope, $element) {
    $scope['path'] = ROOT;
    $scope['os.uiPath'] = ROOT;

    /**
     * @type {string}
     */
    this['application'] = getAppName();

    /**
     * @type {string}
     */
    this['logoPath'] = /** @type {string} */ (Settings.getInstance().get('about.logoPath', 'images/logo.png'));

    /**
     * @type {string}
     */
    this['userAgent'] = navigator.userAgent;

    /**
     * @type {Array.<Object>}
     */
    this['appVendors'] = Settings.getInstance().get(['about', 'appVendors'], []);

    /**
     * @type {Array.<Object>}
     */
    this['vendors'] = Settings.getInstance().get(['about', 'vendors'], []);

    open($element);
  }
}

/**
 * Create the modal
 */
export const launchAboutModal = () => {
  create(windowSelector.CONTAINER, '<about-modal></about-modal>');
};

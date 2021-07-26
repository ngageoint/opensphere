goog.module('os.ui.modal.AboutModalUI');
goog.module.declareLegacyNamespace();

const {ROOT} = goog.require('os');
const {getAppName} = goog.require('os.config');
const Settings = goog.require('os.config.Settings');
const Module = goog.require('os.ui.Module');
const {create, open} = goog.require('os.ui.modal');
const windowSelector = goog.require('os.ui.windowSelector');


/**
 * The about modal displays the version of the browser from navigator.userAgent and the version
 * of the application from the Settings.Config.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
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
const directiveTag = 'about-modal';

/**
 * Register about-modal directive
 */
Module.directive('aboutModal', [directive]);

/**
 * Controller function for the about-modal directive.
 * @unrestricted
 */
class Controller {
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
const launchAboutModal = () => {
  create(windowSelector.CONTAINER, '<about-modal></about-modal>');
};

exports = {
  Controller,
  directive,
  directiveTag,
  launchAboutModal
};

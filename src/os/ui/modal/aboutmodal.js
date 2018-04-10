goog.provide('os.ui.modal.AboutModalCtrl');
goog.provide('os.ui.modal.aboutModalDirective');

goog.require('os.config');
goog.require('os.config.Settings');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.modal');
goog.require('os.ui.modal.modalAutoSizeDirective');


/**
 * The about modal displays the version of the browser from navigator.userAgent and the version
 * of the application from the os.settings.Config.
 *
 * @return {angular.Directive}
 */
os.ui.modal.aboutModalDirective = function() {
  return {
    replace: true,
    restrict: 'E',
    templateUrl: os.ROOT + 'views/modal/aboutmodal.html',
    controller: os.ui.modal.AboutModalCtrl,
    controllerAs: 'aboutModalCtrl'
  };
};


/**
 * Register about-modal directive
 */
os.ui.Module.directive('aboutModal', [os.ui.modal.aboutModalDirective]);



/**
 * Controller function for the about-modal directive.
 * @param {!angular.Scope} $scope The scope
 * @param {!angular.JQLite} $element The element
 * @constructor
 * @ngInject
 */
os.ui.modal.AboutModalCtrl = function($scope, $element) {
  $scope['path'] = os.ROOT;
  $scope['os.uiPath'] = os.ROOT;

  /**
   * @type {string}
   */
  this['application'] = os.config.getAppName();

  /**
   * @type {string}
   */
  this['logoPath'] = /** @type {string} */ (os.settings.get('about.logoPath', 'images/logo.png'));

  /**
   * @type {string}
   */
  this['userAgent'] = navigator.userAgent;

  /**
   * @type {Array.<Object>}
   */
  this['appVendors'] = os.settings.get(['about', 'appVendors'], []);

  /**
   * @type {Array.<Object>}
   */
  this['vendors'] = os.settings.get(['about', 'vendors'], []);

  os.ui.modal.open($element);
};


/**
 * Create the modal
 */
os.ui.modal.AboutModalCtrl.launch = function() {
  os.ui.modal.create(os.ui.windowSelector.CONTAINER, '<about-modal></about-modal>');
};

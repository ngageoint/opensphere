goog.provide('os.Module');
goog.provide('osmain');

goog.require('goog.async.ConditionalDelay');
goog.require('os');
goog.require('os.MainCtrl');
goog.require('os.config');
goog.require('os.config.Settings');
goog.require('os.config.SettingsInitializerManager');
goog.require('os.debug.FancierWindow');
goog.require('os.mixin');
goog.require('os.net');
goog.require('os.ui.LegendUI');
goog.require('os.ui.Map');
goog.require('os.ui.Module');
goog.require('os.ui.addDataDirective');
goog.require('os.ui.clear.ClearUI');
goog.require('os.ui.config.SettingsWindowUI');
goog.require('os.ui.consentDirective');
goog.require('os.ui.globalMenuDirective');
goog.require('os.ui.historyDirective');
goog.require('os.ui.layersDirective');
goog.require('os.ui.metrics.MetricsContainerDirective');
goog.require('os.ui.modal.aboutModalDirective');
goog.require('os.ui.savedWindowDirective');
goog.require('os.ui.serversDirective');
goog.require('os.ui.slick.slickTreeDirective');
goog.require('os.ui.triStateCheckboxDirective');


/**
 * Angular module 'os'
 * @type {angular.Module}
 */
os.Module = angular
    .module('os', [
      'ngAnimate',
      'ngSanitize',
      'ngRoute',
      'os.ui'])
    .filter('reverse', function() {
      return function(items) {
        return items.slice().reverse();
      };
    });


/**
 * Configuration function for <code>os.Module</code>. Used to configure the angular module.
 *
 * @param {!angular.$routeProvider} $routeProvider
 * @param {!angular.$locationProvider} $locationProvider
 * @ngInject
 * @export
 */
os.Module.configureModule = function($routeProvider, $locationProvider) {
  // Angular 1.6.0 defaulted to '#!' instead of '#'
  $locationProvider.hashPrefix('');

  $routeProvider.otherwise({
    template: '<os-main></os-main>',
    reloadOnSearch: false
  });
};

os.Module.config(os.Module.configureModule);


/**
 * Load the settings, then manually bootstrap angular.
 * @todo should we display an informative error message if there are no settings?
 */
(function() {
  var appWait = new goog.async.ConditionalDelay(function() {
    return window.osasm && !!osasm.geodesicInverse;
  });

  /**
   * After osasm loads, kick off the rest of the application
   */
  appWait.onSuccess = function() {
    if (os.isMainWindow()) {
      try {
        // the main application doesn't care what opened it, and accessing window.opener may cause an exception. get rid
        // of it so things like os.instanceOf don't try using it.
        window.opener = null;
      } catch (e) {
        // this doesn't seem to fail in any browser, but in the off chance it does don't break everything
      }

      os.logWindow = new os.debug.FancierWindow('os');

      // set up request handlers
      os.net.addDefaultHandlers();

      // initialize settings for this app
      var settingsInitializer = os.config.SettingsInitializerManager.getInstance().getSettingsInitializer();
      settingsInitializer.init();
    }
  };

  appWait.start(50, 10000);
})();


/**
 * The main directive
 *
 * @return {angular.Directive}
 */
os.uiMainDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/main.html',
    controller: os.MainCtrl,
    controllerAs: 'mainCtrl'
  };
};


os.Module.directive('osMain', [os.uiMainDirective]);

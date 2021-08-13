goog.declareModuleId('os.Module');

/**
 * Angular module 'os'
 * @type {angular.Module}
 */
const Module = angular.module('os', [
  'ngAnimate',
  'ngSanitize',
  'ngRoute',
  'os.ui'
]).filter('reverse', () => (items) => items.slice().reverse());

/**
 * Configuration function for <code>Module</code>. Used to configure the angular module.
 *
 * @param {!angular.$routeProvider} $routeProvider
 * @param {!angular.$locationProvider} $locationProvider
 * @ngInject
 * @export
 */
const configureModule = function($routeProvider, $locationProvider) {
  // Angular 1.6.0 defaulted to '#!' instead of '#'
  $locationProvider.hashPrefix('');

  $routeProvider.otherwise({
    template: '<os-main></os-main>',
    reloadOnSearch: false
  });
};

Module.config(configureModule);

export default Module;

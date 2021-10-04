goog.declareModuleId('os.ui.Module');

/**
 * Angular module "os.ui"
 * @type {!angular.Module}
 */
const Module = angular.module('os.ui', ['ui.directives', 'ngAnimate', 'ngSanitize']);

/**
 * @param {!angular.$compileProvider} $compileProvider
 * @ngInject
 */
const configureModule = function($compileProvider) {
  $compileProvider.aHrefSanitizationWhitelist(/^\s*((https?|s?ftp|mailto|tel|file):|data:image)/);
};

Module.config(configureModule);

export default Module;

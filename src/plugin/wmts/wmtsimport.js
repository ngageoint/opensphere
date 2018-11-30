goog.provide('plugin.wmts.ImportCtrl');
goog.provide('plugin.wmts.importDirective');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.SingleUrlProviderImportCtrl');
goog.require('os.ui.window');
goog.require('plugin.wmts.Server');


/**
 * The WMTS Server import directive
 * @return {angular.Directive}
 */
plugin.wmts.importDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/forms/singleurl.html',
    controller: plugin.wmts.ImportCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('wmtsserver', [plugin.wmts.importDirective]);



/**
 * Controller for the WMTS import dialog
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.SingleUrlProviderImportCtrl}
 * @constructor
 * @ngInject
 */
plugin.wmts.ImportCtrl = function($scope, $element) {
  plugin.wmts.ImportCtrl.base(this, 'constructor', $scope, $element);

  var file = /** @type {os.file.File} */ ($scope['config']['file']);
  $scope['config']['url'] = file ? file.getUrl() : this.getUrl();
  $scope['config']['type'] = plugin.wmts.ID;
  $scope['urlExample'] = 'http://www.example.com/path/to/wmts';
};
goog.inherits(plugin.wmts.ImportCtrl, os.ui.SingleUrlProviderImportCtrl);


/**
 * @inheritDoc
 */
plugin.wmts.ImportCtrl.prototype.getDataProvider = function() {
  var dp = new plugin.wmts.Server();
  dp.configure(this.scope['config']);
  return dp;
};


/**
 * @inheritDoc
 */
plugin.wmts.ImportCtrl.prototype.getUrl = function() {
  return this.dp ? /** @type {plugin.wmts.Server} */ (this.dp).getUrl() : '';
};

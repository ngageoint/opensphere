goog.provide('plugin.arc.ArcImportCtrl');
goog.provide('plugin.arc.arcImportDirective');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.SingleUrlProviderImportCtrl');
goog.require('os.ui.window');
goog.require('plugin.arc.ArcServer');


/**
 * The Arc server import directive
 * @return {angular.Directive}
 */
plugin.arc.arcImportDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/forms/singleurl.html',
    controller: plugin.arc.ArcImportCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('arcserver', [plugin.arc.arcImportDirective]);



/**
 * Controller for the Arc server import dialog
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.SingleUrlProviderImportCtrl}
 * @constructor
 * @ngInject
 */
plugin.arc.ArcImportCtrl = function($scope, $element) {
  plugin.arc.ArcImportCtrl.base(this, 'constructor', $scope, $element);

  var file = /** @type {os.file.File} */ ($scope['config']['file']);
  $scope['config']['url'] = file ? file.getUrl() : this.getUrl();
  $scope['urlExample'] = 'https://www.example.com/arcgis/rest/services';
  $scope['config']['type'] = 'arc';
  $scope['config']['label'] = this.getLabel() || 'ArcGIS Server';
};
goog.inherits(plugin.arc.ArcImportCtrl, os.ui.SingleUrlProviderImportCtrl);


/**
 * @inheritDoc
 */
plugin.arc.ArcImportCtrl.prototype.getDataProvider = function() {
  var dp = new plugin.arc.ArcServer();
  dp.configure(this.scope['config']);
  return dp;
};


/**
 * @inheritDoc
 */
plugin.arc.ArcImportCtrl.prototype.getUrl = function() {
  if (this.dp) {
    var url = /** @type {plugin.arc.ArcServer} */ (this.dp).getUrl();
    return url || '';
  }

  return '';
};


/**
 * @inheritDoc
 */
plugin.arc.ArcImportCtrl.prototype.getLabel = function() {
  if (this.dp) {
    var label = /** @type {plugin.arc.ArcServer} */ (this.dp).getLabel();
    return label || '';
  }

  return '';
};

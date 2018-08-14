goog.provide('plugin.ogc.ui.GeoserverImportCtrl');
goog.provide('plugin.ogc.ui.geoserverDirective');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.SingleUrlProviderImportCtrl');
goog.require('os.ui.WindowEventType');
goog.require('os.ui.window');
goog.require('plugin.ogc.GeoServer');


/**
 * The geoserver import directive
 * @return {angular.Directive}
 */
plugin.ogc.ui.geoserverDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/forms/singleurl.html',
    controller: plugin.ogc.ui.GeoserverImportCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('geoserver', [plugin.ogc.ui.geoserverDirective]);



/**
 * Controller for the geoserver import dialog
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.SingleUrlProviderImportCtrl}
 * @constructor
 * @ngInject
 */
plugin.ogc.ui.GeoserverImportCtrl = function($scope, $element) {
  plugin.ogc.ui.GeoserverImportCtrl.base(this, 'constructor', $scope, $element);

  var file = /** @type {os.file.File} */ ($scope['config']['file']);
  // regex handles URLs of the sort /geoserver(/stuff)/ows(/otherstuff), where it keeps (/stuff) intact, but removes
  // (/otherstuff) at the end of the URL
  $scope['config']['url'] = file ? file.getUrl().replace(/(\/geoserver|\/.*?gs)(\/.*)(web|ows)[#?\/].*$/, '/geoserver$1ows') :
      this.getUrl();
  $scope['config']['type'] = 'geoserver';

  $scope['urlExample'] = 'http://www.example.com/geoserver/ows';
};
goog.inherits(plugin.ogc.ui.GeoserverImportCtrl, os.ui.SingleUrlProviderImportCtrl);


/**
 * @inheritDoc
 */
plugin.ogc.ui.GeoserverImportCtrl.prototype.getDataProvider = function() {
  var dp = new plugin.ogc.GeoServer();
  dp.configure(this.scope['config']);
  return dp;
};


/**
 * @inheritDoc
 */
plugin.ogc.ui.GeoserverImportCtrl.prototype.getUrl = function() {
  return this.dp ? /** @type {plugin.ogc.GeoServer} */ (this.dp).getOriginalWmsUrl() : '';
};

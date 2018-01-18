goog.provide('plugin.georss.GeoRSSImportCtrl');
goog.provide('plugin.georss.georssImportDirective');

goog.require('os.data.DataManager');
goog.require('os.defines');
goog.require('os.file.FileStorage');
goog.require('os.ui.Module');
goog.require('os.ui.file.ui.AbstractFileImportCtrl');
goog.require('os.ui.window');


/**
 * The GeoRSS import directive
 * @return {angular.Directive}
 */
plugin.georss.georssImportDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/plugin/georss/georssimport.html',
    controller: plugin.georss.GeoRSSImportCtrl,
    controllerAs: 'georssImport'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('georssimport', [plugin.georss.georssImportDirective]);


/**
 * Controller for the GeoRSS import dialog
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.file.ui.AbstractFileImportCtrl<!os.parse.FileParserConfig, !plugin.georss.GeoRSSDescriptor>}
 * @constructor
 * @ngInject
 */
plugin.georss.GeoRSSImportCtrl = function($scope, $element) {
  plugin.georss.GeoRSSImportCtrl.base(this, 'constructor', $scope, $element);
  this.formName = 'georssForm';
};
goog.inherits(plugin.georss.GeoRSSImportCtrl, os.ui.file.ui.AbstractFileImportCtrl);


/**
 * @inheritDoc
 */
plugin.georss.GeoRSSImportCtrl.prototype.createDescriptor = function() {
};


/**
 * @inheritDoc
 */
plugin.georss.GeoRSSImportCtrl.prototype.getProvider = function() {
  return plugin.georss.GeoRSSProvider.getInstance();
};

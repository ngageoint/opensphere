goog.provide('plugin.file.geojson.GeoJSONImportCtrl');
goog.provide('plugin.file.geojson.geojsonImportDirective');

goog.require('os.ui.Module');
goog.require('os.ui.im.FileImportWizard');
goog.require('os.ui.wiz.wizardDirective');
goog.require('plugin.file.geojson.GeoJSONDescriptor');
goog.require('plugin.file.geojson.GeoJSONProvider');



/**
 * Controller for the GeoJSON import wizard window
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @param {!Object.<string, string>} $attrs
 * @extends {os.ui.im.FileImportWizard.<!plugin.file.geojson.GeoJSONParserConfig, !plugin.file.geojson.GeoJSONDescriptor>}
 * @constructor
 * @ngInject
 */
plugin.file.geojson.GeoJSONImportCtrl = function($scope, $element, $timeout, $attrs) {
  plugin.file.geojson.GeoJSONImportCtrl.base(this, 'constructor', $scope, $element, $timeout, $attrs);
};
goog.inherits(plugin.file.geojson.GeoJSONImportCtrl, os.ui.im.FileImportWizard);


/**
 * @param {!plugin.file.geojson.GeoJSONDescriptor} descriptor
 * @protected
 * @override
 */
plugin.file.geojson.GeoJSONImportCtrl.prototype.addDescriptorToProvider = function(descriptor) {
  plugin.file.geojson.GeoJSONProvider.getInstance().addDescriptor(descriptor);
};


/**
 * @param {!plugin.file.geojson.GeoJSONParserConfig} config
 * @return {!plugin.file.geojson.GeoJSONDescriptor}
 * @protected
 * @override
 */
plugin.file.geojson.GeoJSONImportCtrl.prototype.createFromConfig = function(config) {
  return plugin.file.geojson.GeoJSONDescriptor.createFromConfig(this.config);
};


/**
 * @param {!plugin.file.geojson.GeoJSONDescriptor} descriptor
 * @param {!plugin.file.geojson.GeoJSONParserConfig} config
 * @protected
 * @override
 */
plugin.file.geojson.GeoJSONImportCtrl.prototype.updateFromConfig = function(descriptor, config) {
  plugin.file.geojson.GeoJSONDescriptor.updateFromConfig(descriptor, config);
};


/**
 * The GeoJSON import wizard directive.
 * @return {angular.Directive}
 */
plugin.file.geojson.geojsonImportDirective = function() {
  var dir = os.ui.wiz.wizardDirective();
  dir.controller = plugin.file.geojson.GeoJSONImportCtrl;
  return dir;
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('geojsonimport', [plugin.file.geojson.geojsonImportDirective]);

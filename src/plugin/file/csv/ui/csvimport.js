goog.provide('plugin.file.csv.ui.CSVImportCtrl');
goog.provide('plugin.file.csv.ui.csvImportDirective');

goog.require('os.data.DataManager');
goog.require('os.file.FileStorage');
goog.require('os.ui.Module');
goog.require('os.ui.im.FileImportWizard');
goog.require('os.ui.wiz.wizardDirective');
goog.require('plugin.file.csv.CSVDescriptor');
goog.require('plugin.file.csv.CSVParserConfig');
goog.require('plugin.file.csv.CSVProvider');



/**
 * Controller for the CSV import wizard window
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @param {!Object.<string, string>} $attrs
 * @extends {os.ui.im.FileImportWizard.<!plugin.file.csv.CSVParserConfig,!plugin.file.csv.CSVDescriptor>}
 * @constructor
 * @ngInject
 */
plugin.file.csv.ui.CSVImportCtrl = function($scope, $element, $timeout, $attrs) {
  plugin.file.csv.ui.CSVImportCtrl.base(this, 'constructor', $scope, $element, $timeout, $attrs);
};
goog.inherits(plugin.file.csv.ui.CSVImportCtrl, os.ui.im.FileImportWizard);


/**
 * @param {!plugin.file.csv.CSVDescriptor} descriptor
 * @protected
 * @override
 */
plugin.file.csv.ui.CSVImportCtrl.prototype.addDescriptorToProvider = function(descriptor) {
  plugin.file.csv.CSVProvider.getInstance().addDescriptor(descriptor);
};


/**
 * @param {!plugin.file.csv.CSVParserConfig} config
 * @return {!plugin.file.csv.CSVDescriptor}
 * @protected
 * @override
 */
plugin.file.csv.ui.CSVImportCtrl.prototype.createFromConfig = function(config) {
  return plugin.file.csv.CSVDescriptor.createFromConfig(this.config);
};


/**
 * @param {!plugin.file.csv.CSVDescriptor} descriptor
 * @param {!plugin.file.csv.CSVParserConfig} config
 * @protected
 * @override
 */
plugin.file.csv.ui.CSVImportCtrl.prototype.updateFromConfig = function(descriptor, config) {
  plugin.file.csv.CSVDescriptor.updateFromConfig(descriptor, config);
};


/**
 * The CSV import wizard directive.
 * @return {angular.Directive}
 */
plugin.file.csv.ui.csvImportDirective = function() {
  var dir = os.ui.wiz.wizardDirective();
  dir.controller = plugin.file.csv.ui.CSVImportCtrl;
  return dir;
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('csvimport', [plugin.file.csv.ui.csvImportDirective]);

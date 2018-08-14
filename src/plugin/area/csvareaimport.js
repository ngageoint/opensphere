goog.provide('plugin.area.CSVAreaImportCtrl');
goog.provide('plugin.area.csvAreaImportDirective');

goog.require('os.events.EventType');
goog.require('os.im.Importer');
goog.require('os.ui.Module');
goog.require('os.ui.wiz.WizardCtrl');
goog.require('os.ui.wiz.wizardDirective');
goog.require('plugin.area');
goog.require('plugin.file.csv.CSVParser');



/**
 * Controller for the CSV import wizard window
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @param {!Object<string, string>} $attrs
 * @extends {os.ui.wiz.WizardCtrl<T>}
 * @constructor
 * @ngInject
 * @template T,S
 */
plugin.area.CSVAreaImportCtrl = function($scope, $element, $timeout, $attrs) {
  plugin.area.CSVAreaImportCtrl.base(this, 'constructor', $scope, $element, $timeout, $attrs);
};
goog.inherits(plugin.area.CSVAreaImportCtrl, os.ui.wiz.WizardCtrl);


/**
 * @inheritDoc
 */
plugin.area.CSVAreaImportCtrl.prototype.finish = function() {
  this['loading'] = true;

  var parser = new plugin.file.csv.CSVParser(this.scope['config']);
  var importer = new os.im.Importer(parser);
  importer.setMappings(this.scope['config']['mappings']);
  importer.listenOnce(os.events.EventType.COMPLETE, this.onImportComplete_, false, this);
  importer.startImport(this.scope['config']['file'].getContent());
};


/**
 * Success callback for importing data. Adds the areas to Area Manager
 * @param {goog.events.Event} event
 * @private
 */
plugin.area.CSVAreaImportCtrl.prototype.onImportComplete_ = function(event) {
  var importer = /** @type {os.im.Importer} */ (event.target);
  var features = /** @type {!Array<ol.Feature>} */ (importer.getData());
  importer.dispose();

  if (features && features.length > 0) {
    this.scope['config'][os.data.RecordField.SOURCE_NAME] = this.scope['config']['file'].getFileName();
    plugin.area.processFeatures(features, this.scope['config']);
  }

  os.ui.window.close(this.element);
};


/**
 * The CSV import wizard directive.
 * @return {angular.Directive}
 */
plugin.area.csvAreaImportDirective = function() {
  var dir = os.ui.wiz.wizardDirective();
  dir.controller = plugin.area.CSVAreaImportCtrl;
  return dir;
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('csvareaimport', [plugin.area.csvAreaImportDirective]);

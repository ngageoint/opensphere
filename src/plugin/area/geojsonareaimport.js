goog.provide('plugin.area.GeoJSONAreaImportCtrl');
goog.provide('plugin.area.geojsonAreaImportDirective');

goog.require('os.events.EventType');
goog.require('os.im.Importer');
goog.require('os.ui.Module');
goog.require('os.ui.wiz.WizardCtrl');
goog.require('os.ui.wiz.wizardDirective');
goog.require('plugin.area');
goog.require('plugin.file.geojson.GeoJSONDescriptor');
goog.require('plugin.file.geojson.GeoJSONParser');
goog.require('plugin.file.geojson.GeoJSONProvider');



/**
 * Controller for the GeoJSON import wizard window
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$timeout} $timeout
 * @param {!Object.<string, string>} $attrs
 * @extends {os.ui.wiz.WizardCtrl<T>}
 * @constructor
 * @ngInject
 * @template T,S
 */
plugin.area.GeoJSONAreaImportCtrl = function($scope, $element, $timeout, $attrs) {
  plugin.area.GeoJSONAreaImportCtrl.base(this, 'constructor', $scope, $element, $timeout, $attrs);
};
goog.inherits(plugin.area.GeoJSONAreaImportCtrl, os.ui.wiz.WizardCtrl);


/**
 * @inheritDoc
 */
plugin.area.GeoJSONAreaImportCtrl.prototype.finish = function() {
  this['loading'] = true;

  var parser = new plugin.file.geojson.GeoJSONParser();
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
plugin.area.GeoJSONAreaImportCtrl.prototype.onImportComplete_ = function(event) {
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
 * The geojson import wizard directive.
 * @return {angular.Directive}
 */
plugin.area.geojsonAreaImportDirective = function() {
  var dir = os.ui.wiz.wizardDirective();
  dir.controller = plugin.area.GeoJSONAreaImportCtrl;
  return dir;
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('geojsonareaimport', [plugin.area.geojsonAreaImportDirective]);

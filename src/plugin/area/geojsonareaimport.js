goog.module('plugin.area.GeoJSONAreaImport');
goog.module.declareLegacyNamespace();

const RecordField = goog.require('os.data.RecordField');
const EventType = goog.require('os.events.EventType');
const Importer = goog.require('os.im.Importer');
const Module = goog.require('os.ui.Module');
const osWindow = goog.require('os.ui.window');
const WizardCtrl = goog.require('os.ui.wiz.WizardCtrl');
const wizardDirective = goog.require('os.ui.wiz.wizardDirective');
const area = goog.require('plugin.area');
const GeoJSONParser = goog.require('plugin.file.geojson.GeoJSONParser');


/**
 * Controller for the GeoJSON import wizard window
 *
 * @extends {WizardCtrl<T>}
 * @template T,S
 * @unrestricted
 */
class Controller extends WizardCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @param {!Object.<string, string>} $attrs
   * @ngInject
   */
  constructor($scope, $element, $timeout, $attrs) {
    super($scope, $element, $timeout, $attrs);
  }

  /**
   * @inheritDoc
   */
  finish() {
    this['loading'] = true;

    var parser = new GeoJSONParser();
    var importer = new Importer(parser);
    importer.setMappings(this.scope['config']['mappings']);
    importer.listenOnce(EventType.COMPLETE, this.onImportComplete_, false, this);
    importer.startImport(this.scope['config']['file'].getContent());
  }

  /**
   * Success callback for importing data. Adds the areas to Area Manager
   *
   * @param {goog.events.Event} event
   * @private
   */
  onImportComplete_(event) {
    var importer = /** @type {Importer} */ (event.target);
    var features = /** @type {!Array<ol.Feature>} */ (importer.getData());
    importer.dispose();

    if (features && features.length > 0) {
      this.scope['config'][RecordField.SOURCE_NAME] = this.scope['config']['file'].getFileName();
      area.processFeatures(features, this.scope['config']);
    }

    osWindow.close(this.element);
  }
}

/**
 * The geojson import wizard directive.
 *
 * @return {angular.Directive}
 */
const directive = () => {
  var dir = wizardDirective();
  dir.controller = Controller;
  return dir;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'geojsonareaimport';


/**
 * Add the directive to the module
 */
Module.directive('geojsonareaimport', [directive]);

exports = {
  Controller,
  directive,
  directiveTag
};

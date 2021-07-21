goog.module('plugin.file.geojson.GeoJSONImport');
goog.module.declareLegacyNamespace();

const FileDescriptor = goog.require('os.data.FileDescriptor');
const Module = goog.require('os.ui.Module');
const FileImportWizard = goog.require('os.ui.im.FileImportWizard');
const {directive: wizardDirective} = goog.require('os.ui.wiz.WizardUI');
const GeoJSONDescriptor = goog.require('plugin.file.geojson.GeoJSONDescriptor');
const GeoJSONProvider = goog.require('plugin.file.geojson.GeoJSONProvider');


/**
 * Controller for the GeoJSON import wizard window
 *
 * @extends {FileImportWizard.<!plugin.file.geojson.GeoJSONParserConfig, !GeoJSONDescriptor>}
 * @unrestricted
 */
class Controller extends FileImportWizard {
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
   * @param {!GeoJSONDescriptor} descriptor
   * @protected
   * @override
   */
  addDescriptorToProvider(descriptor) {
    GeoJSONProvider.getInstance().addDescriptor(descriptor);
  }

  /**
   * @param {!plugin.file.geojson.GeoJSONParserConfig} config
   * @return {!GeoJSONDescriptor}
   * @protected
   * @override
   */
  createFromConfig(config) {
    const descriptor = new GeoJSONDescriptor(this.config);
    FileDescriptor.createFromConfig(descriptor, GeoJSONProvider.getInstance(), this.config);
    return descriptor;
  }

  /**
   * @param {!GeoJSONDescriptor} descriptor
   * @param {!plugin.file.geojson.GeoJSONParserConfig} config
   * @protected
   * @override
   */
  updateFromConfig(descriptor, config) {
    descriptor.updateFromConfig(config);
  }
}

/**
 * The GeoJSON import wizard directive.
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
const directiveTag = 'geojsonimport';


/**
 * Add the directive to the module
 */
Module.directive('geojsonimport', [directive]);

exports = {
  Controller,
  directive,
  directiveTag
};

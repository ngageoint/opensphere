goog.declareModuleId('plugin.file.geojson.GeoJSONImport');

import FileDescriptor from '../../../os/data/filedescriptor.js';
import FileImportWizard from '../../../os/ui/im/fileimportwizard.js';
import Module from '../../../os/ui/module.js';
import {directive as wizardDirective} from '../../../os/ui/wiz/wizard.js';
import GeoJSONDescriptor from './geojsondescriptor.js';
import GeoJSONProvider from './geojsonprovider.js';


/**
 * Controller for the GeoJSON import wizard window
 *
 * @extends {FileImportWizard.<!plugin.file.geojson.GeoJSONParserConfig, !GeoJSONDescriptor>}
 * @unrestricted
 */
export class Controller extends FileImportWizard {
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
export const directive = () => {
  var dir = wizardDirective();
  dir.controller = Controller;
  return dir;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'geojsonimport';


/**
 * Add the directive to the module
 */
Module.directive('geojsonimport', [directive]);

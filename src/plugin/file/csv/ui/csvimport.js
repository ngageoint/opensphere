goog.declareModuleId('plugin.file.csv.ui.CSVImport');

import FileDescriptor from '../../../../os/data/filedescriptor.js';
import FileImportWizard from '../../../../os/ui/im/fileimportwizard.js';
import Module from '../../../../os/ui/module.js';
import {directive as wizardDirective} from '../../../../os/ui/wiz/wizard.js';
import CSVDescriptor from '../csvdescriptor.js';
import CSVProvider from '../csvprovider.js';


/**
 * Controller for the CSV import wizard window
 *
 * @extends {FileImportWizard.<!CSVParserConfig,!CSVDescriptor>}
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
   * @param {!CSVDescriptor} descriptor
   * @protected
   * @override
   */
  addDescriptorToProvider(descriptor) {
    CSVProvider.getInstance().addDescriptor(descriptor);
  }

  /**
   * @param {!CSVParserConfig} config
   * @return {!CSVDescriptor}
   * @protected
   * @override
   */
  createFromConfig(config) {
    const descriptor = new CSVDescriptor(this.config);
    FileDescriptor.createFromConfig(descriptor, CSVProvider.getInstance(), this.config);
    return descriptor;
  }

  /**
   * @param {!CSVDescriptor} descriptor
   * @param {!CSVParserConfig} config
   * @protected
   * @override
   */
  updateFromConfig(descriptor, config) {
    descriptor.updateFromConfig(config);
  }
}

/**
 * The CSV import wizard directive.
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
export const directiveTag = 'csvimport';


/**
 * Add the directive to the module
 */
Module.directive('csvimport', [directive]);

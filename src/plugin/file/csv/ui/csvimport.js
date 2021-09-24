goog.declareModuleId('plugin.file.csv.ui.CSVImport');

const FileDescriptor = goog.require('os.data.FileDescriptor');
const Module = goog.require('os.ui.Module');
const FileImportWizard = goog.require('os.ui.im.FileImportWizard');
const {directive: wizardDirective} = goog.require('os.ui.wiz.WizardUI');
const CSVDescriptor = goog.require('plugin.file.csv.CSVDescriptor');
const CSVProvider = goog.require('plugin.file.csv.CSVProvider');
const CSVParserConfig = goog.requireType('plugin.file.csv.CSVParserConfig');


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

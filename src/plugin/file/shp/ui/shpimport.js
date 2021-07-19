goog.module('plugin.file.shp.ui.SHPImport');
goog.module.declareLegacyNamespace();

const osFile = goog.require('os.file');

const Module = goog.require('os.ui.Module');
const FileImportWizard = goog.require('os.ui.im.FileImportWizard');
const {directive: wizardDirective} = goog.require('os.ui.wiz.WizardUI');
const SHPDescriptor = goog.require('plugin.file.shp.SHPDescriptor');
const SHPProvider = goog.require('plugin.file.shp.SHPProvider');
const SHPParserConfig = goog.requireType('plugin.file.shp.SHPParserConfig');


/**
 * Controller for the SHP import wizard window
 *
 * @extends {FileImportWizard.<!SHPParserConfig,!SHPDescriptor>}
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
   * @inheritDoc
   */
  cleanConfig() {
    if (this.config) {
      this.config['file2'] = null;
      this.config['zipFile'] = null;
    }

    super.cleanConfig();
  }

  /**
   * @inheritDoc
   */
  storeAndFinish(descriptor) {
    if (this.config['zipFile']) {
      if (osFile.isLocal(this.config['zipFile'])) {
        // store the ZIP
        this.fs.storeFile(this.config['zipFile'], true)
            .addCallbacks(goog.partial(this.finishImport, descriptor), this.onPersistError, this);
      } else {
        // local zip - finish up
        this.finishImport(descriptor);
      }
    } else {
      var localShp = osFile.isLocal(this.config['file']);
      var localDbf = osFile.isLocal(this.config['file2']);
      if (localShp && localDbf) {
        // store both the SHP and DBF
        this.fs.storeFile(this.config['file2'], true)
            .awaitDeferred(this.fs.storeFile(this.config['file'], true))
            .addCallbacks(goog.partial(this.finishImport, descriptor), this.onPersistError, this);
      } else if (localShp) {
        // store the SHP
        this.fs.storeFile(this.config['file'], true)
            .addCallbacks(goog.partial(this.finishImport, descriptor), this.onPersistError, this);
      } else if (localDbf) {
        // store the DBF
        this.fs.storeFile(this.config['file2'], true)
            .addCallbacks(goog.partial(this.finishImport, descriptor), this.onPersistError, this);
      } else {
        // both local - finish up
        this.finishImport(descriptor);
      }
    }
  }

  /**
   * @param {!SHPDescriptor} descriptor
   * @protected
   * @override
   */
  addDescriptorToProvider(descriptor) {
    SHPProvider.getInstance().addDescriptor(descriptor);
  }

  /**
   * @param {!SHPParserConfig} config
   * @return {!SHPDescriptor}
   * @protected
   * @override
   */
  createFromConfig(config) {
    const descriptor = new SHPDescriptor(this.config);
    SHPDescriptor.createFromConfig(descriptor, SHPProvider.getInstance(), this.config);
    return descriptor;
  }

  /**
   * @param {!SHPDescriptor} descriptor
   * @param {!SHPParserConfig} config
   * @protected
   * @override
   */
  updateFromConfig(descriptor, config) {
    descriptor.updateFromConfig(config);
  }
}

/**
 * The SHP import wizard directive.
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
const directiveTag = 'shpimport';


/**
 * Add the directive to the module
 */
Module.directive('shpimport', [directive]);

exports = {
  Controller,
  directive,
  directiveTag
};

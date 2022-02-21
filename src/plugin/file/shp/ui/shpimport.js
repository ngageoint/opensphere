goog.declareModuleId('plugin.file.shp.ui.SHPImport');

import * as osFile from '../../../../os/file/index.js';
import FileImportWizard from '../../../../os/ui/im/fileimportwizard.js';
import Module from '../../../../os/ui/module.js';
import {directive as wizardDirective} from '../../../../os/ui/wiz/wizard.js';
import SHPDescriptor from '../shpdescriptor.js';
import SHPProvider from '../shpprovider.js';

/**
 * Controller for the SHP import wizard window
 *
 * @extends {FileImportWizard.<!SHPParserConfig,!SHPDescriptor>}
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
export const directive = () => {
  var dir = wizardDirective();
  dir.controller = Controller;
  return dir;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'shpimport';


/**
 * Add the directive to the module
 */
Module.directive('shpimport', [directive]);

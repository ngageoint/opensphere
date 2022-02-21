goog.declareModuleId('plugin.file.kml.ui.KMLImport');

import FileDescriptor from '../../../../os/data/filedescriptor.js';
import {ROOT} from '../../../../os/os.js';
import AbstractFileImportCtrl from '../../../../os/ui/file/ui/abstractfileimport.js';
import Module from '../../../../os/ui/module.js';
import KMLDescriptor from '../kmldescriptor.js';
import KMLProvider from '../kmlprovider.js';


/**
 * The KML import directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/file/genericfileimport.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'kmlimport';


/**
 * Add the directive to the module
 */
Module.directive('kmlimport', [directive]);



/**
 * Controller for the KML import dialog
 *
 * @extends {AbstractFileImportCtrl<!FileParserConfig,!KMLDescriptor>}
 * @unrestricted
 */
export class Controller extends AbstractFileImportCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);
  }

  /**
   * @inheritDoc
   */
  createDescriptor() {
    var descriptor = null;
    if (this.config['descriptor']) {
      // existing descriptor, update it
      descriptor = /** @type {!KMLDescriptor} */ (this.config['descriptor']);
      descriptor.updateFromConfig(this.config);
    } else {
      // this is a new import
      descriptor = new KMLDescriptor();
      FileDescriptor.createFromConfig(descriptor, KMLProvider.getInstance(), this.config);
    }

    return descriptor;
  }

  /**
   * @inheritDoc
   */
  getProvider() {
    return KMLProvider.getInstance();
  }
}

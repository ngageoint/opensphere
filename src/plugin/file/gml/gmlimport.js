goog.declareModuleId('plugin.file.gml.GMLImport');

import FileDescriptor from '../../../os/data/filedescriptor.js';
import {ROOT} from '../../../os/os.js';
import AbstractFileImportCtrl from '../../../os/ui/file/ui/abstractfileimport.js';
import Module from '../../../os/ui/module.js';
import GMLDescriptor from './gmldescriptor.js';
import GMLProvider from './gmlprovider.js';


/**
 * The GML import directive
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
export const directiveTag = 'gmlimport';


/**
 * Add the directive to the module
 */
Module.directive('gmlimport', [directive]);



/**
 * Controller for the GML import dialog
 *
 * @extends {AbstractFileImportCtrl<!GMLParserConfig,!GMLDescriptor>}
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
      descriptor = /** @type {!GMLDescriptor} */ (this.config['descriptor']);
      descriptor.updateFromConfig(this.config);
    } else {
      // this is a new import
      descriptor = new GMLDescriptor(this.config);
      FileDescriptor.createFromConfig(descriptor, GMLProvider.getInstance(), this.config);
    }

    return descriptor;
  }

  /**
   * @inheritDoc
   */
  getProvider() {
    return GMLProvider.getInstance();
  }
}

goog.declareModuleId('plugin.cesium.tiles.TilesetImport');

import {ROOT} from '../../../os/os.js';
import Descriptor from './cesium3dtilesdescriptor.js';
import Provider from './cesium3dtilesprovider.js';

const Module = goog.require('os.ui.Module');
const AbstractFileImportCtrl = goog.require('os.ui.file.ui.AbstractFileImportCtrl');

const FileParserConfig = goog.requireType('os.parse.FileParserConfig');


/**
 * The 3D tiles import directive
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
export const directiveTag = 'tilesetimport';


/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);



/**
 * Controller for the 3D tiles import dialog
 *
 * @extends {AbstractFileImportCtrl<!Object,!Descriptor>}
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
      descriptor = /** @type {!Descriptor} */ (this.config['descriptor']);
      descriptor.updateFromConfig(/** @type {!FileParserConfig} */ (this.config));
    } else {
      // this is a new import
      descriptor = Descriptor.create(this.config);
    }

    return descriptor;
  }

  /**
   * @inheritDoc
   */
  getProvider() {
    return Provider.getInstance();
  }
}

goog.declareModuleId('plugin.file.gpx.ui.GPXImport');

import FileDescriptor from '../../../../os/data/filedescriptor.js';
import {ROOT} from '../../../../os/os.js';
import AbstractFileImportCtrl from '../../../../os/ui/file/ui/abstractfileimport.js';
import Module from '../../../../os/ui/module.js';
import GPXDescriptor from '../gpxdescriptor.js';
import GPXProvider from '../gpxprovider.js';

/**
 * The GPX import directive.
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
export const directiveTag = 'gpximport';


/**
 * Add the directive to the module.
 */
Module.directive('gpximport', [directive]);



/**
 * Controller for the GPX import dialog.
 *
 * @extends {AbstractFileImportCtrl<!FileParserConfig, !GPXDescriptor>}
 * @unrestricted
 */
export class Controller extends AbstractFileImportCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
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
      // existing descriptor. deactivate the descriptor, then update it
      descriptor = this.config['descriptor'];
      descriptor.setActive(false);
      descriptor.updateFromConfig(this.config);
    } else {
      // this is a new import
      descriptor = new GPXDescriptor();
      FileDescriptor.createFromConfig(descriptor, GPXProvider.getInstance(), this.config);
    }

    return descriptor;
  }

  /**
   * @inheritDoc
   */
  getProvider() {
    return GPXProvider.getInstance();
  }
}

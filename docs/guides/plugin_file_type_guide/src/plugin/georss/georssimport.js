goog.declareModuleId('plugin.georss.GeoRSSImportUI');

import AbstractFileImportCtrl from 'opensphere/src/os/ui/file/ui/abstractfileimport.js';
import Module from 'opensphere/src/os/ui/module.js';

import {ROOT} from './georss.js';
import {createFromConfig} from './georssdescriptor.js';
import GeoRSSProvider from './georssprovider.js';

const {default: GeoRSSDescriptor} = goog.requireType('plugin.georss.GeoRSSDescriptor');


/**
 * The GeoRSS import directive
 * @return {angular.Directive}
 */
/* istanbul ignore next */
export const directive = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    // The plugin.georss.ROOT define used here helps to fix the paths in the debug instance
    // vs. the compiled instance. This example assumes that you are creating an external
    // plugin. You do not necessarily need a ROOT define per plugin, but rather per project
    // so that the OpenSphere build can find the files properly.
    //
    // For an internal plugin, just require os and use os.ROOT.
    templateUrl: ROOT + 'views/plugin/georss/georssimport.html',
    controller: Controller,
    controllerAs: 'georssImport'
  };
};

/**
 * Add the directive to the module
 */
Module.directive('georssimport', [directive]);

/**
 * Controller for the GeoRSS import dialog
 */
export class Controller extends AbstractFileImportCtrl {
  /**
   * Controller for the GeoRSS import dialog
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);
    this.formName = 'georssForm';
  }

  /**
   * @inheritDoc
   */
  createDescriptor() {
    var descriptor = null;
    if (this.config['descriptor']) { // existing descriptor, update it
      descriptor = /** @type {!GeoRSSDescriptor} */ (this.config['descriptor']);
      descriptor.updateFromConfig(this.config);
    } else { // this is a new import
      descriptor = createFromConfig(this.config);
    }

    return descriptor;
  }

  /**
   * @inheritDoc
   */
  getProvider() {
    return GeoRSSProvider.getInstance();
  }
}


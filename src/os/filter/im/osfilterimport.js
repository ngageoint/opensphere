goog.declareModuleId('os.filter.im.OSFilterImport');

import osImplements from '../../implements.js';
import {getMapContainer} from '../../map/mapinstance.js';
import {directive as filterImportDirective, Controller as FilterImportCtrl} from '../../ui/filter/im/filterimport.js';
import Module from '../../ui/module.js';
import IFilterable from '../ifilterable.js';
import OSFilterImporter from './osfilterimporter.js';


/**
 * The osfilterimport directive
 *
 * @return {angular.Directive}
 */
export const directive = () => {
  var dir = filterImportDirective();
  dir.controller = Controller;
  return dir;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'osfilterimport';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the filter import directive
 * @unrestricted
 */
export class Controller extends FilterImportCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @param {!angular.$sce} $sce Angular SCE service.
   * @ngInject
   */
  constructor($scope, $element, $sce) {
    super($scope, $element, $sce);
  }

  /**
   * @inheritDoc
   */
  getImporter() {
    var layerId = /** @type {string|undefined} */ (this.scope['layerId']);
    return new OSFilterImporter(this.getParser(), layerId);
  }

  /**
   * Get the base filterable descriptors and add in the filterable layers.
   * @inheritDoc
   */
  getFilterables() {
    var filterables = super.getFilterables();
    var layers = getMapContainer().getLayers();

    if (layers) {
      layers.forEach(function(layer) {
        if (osImplements(layer, IFilterable.ID)) {
          layer = /** @type {IFilterable} */ (layer);

          if (layer.isFilterable()) {
            filterables.unshift(layer);
          }
        }
      });
    }

    return filterables;
  }
}

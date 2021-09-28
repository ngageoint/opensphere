goog.declareModuleId('os.ui.search.place.CoordinateResultCardUI');

import * as osMap from '../../../map/map.js';
import {ROOT} from '../../../os.js';
import Module from '../../module.js';
import FeatureResultCardCtrl from '../featureresultcard.js';

const {toLonLat} = goog.require('ol.proj');

const Point = goog.requireType('ol.geom.Point');


/**
 * The beresultcard directive for displaying search results.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/search/place/coordinateresultcard.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'coordresultcard';

/**
 * Register the beresultcard directive.
 */
Module.directive('coordresultcard', [directive]);

/**
 * Controller for the beresultcard directive.
 * @unrestricted
 */
export class Controller extends FeatureResultCardCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    var geom = /** @type {Point} */ (this.feature.getGeometry());
    var coord = toLonLat(geom.getFirstCoordinate(), osMap.PROJECTION);

    /**
     * @type {number}
     */
    this['lat'] = coord[1];

    /**
     * @type {number}
     */
    this['lon'] = coord[0];

    /**
     * @type {string}
     */
    this['mgrs'] = osasm.toMGRS(/** @type {Array<number>} */ ([this['lon'], this['lat']]));
  }
}

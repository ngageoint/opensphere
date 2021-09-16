goog.module('os.ui.search.place.CoordinateResultCardUI');

const {toLonLat} = goog.require('ol.proj');
const {ROOT} = goog.require('os');
const osMap = goog.require('os.map');
const Module = goog.require('os.ui.Module');
const FeatureResultCardCtrl = goog.require('os.ui.search.FeatureResultCardCtrl');

const Point = goog.requireType('ol.geom.Point');


/**
 * The beresultcard directive for displaying search results.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
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
const directiveTag = 'coordresultcard';

/**
 * Register the beresultcard directive.
 */
Module.directive('coordresultcard', [directive]);

/**
 * Controller for the beresultcard directive.
 * @unrestricted
 */
class Controller extends FeatureResultCardCtrl {
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

exports = {
  Controller,
  directive,
  directiveTag
};

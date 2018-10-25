goog.provide('os.ui.search.place.CoordinateResultCardCtrl');
goog.provide('os.ui.search.place.coordResultCardDirective');

goog.require('os.defines');
goog.require('os.map');
goog.require('os.ui.Module');
goog.require('os.ui.search.FeatureResultCardCtrl');


/**
 * The beresultcard directive for displaying search results.
 * @return {angular.Directive}
 */
os.ui.search.place.coordResultCardDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: os.ROOT + 'views/search/place/coordinateresultcard.html',
    controller: os.ui.search.place.CoordinateResultCardCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Register the beresultcard directive.
 */
os.ui.Module.directive('coordresultcard', [os.ui.search.place.coordResultCardDirective]);



/**
 * Controller for the beresultcard directive.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @extends {os.ui.search.FeatureResultCardCtrl}
 * @ngInject
 */
os.ui.search.place.CoordinateResultCardCtrl = function($scope, $element) {
  os.ui.search.place.CoordinateResultCardCtrl.base(this, 'constructor', $scope, $element);

  var geom = /** @type {ol.geom.Point} */ (this.feature.getGeometry());
  var coord = ol.proj.toLonLat(geom.getFirstCoordinate(), os.map.PROJECTION);

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
};
goog.inherits(os.ui.search.place.CoordinateResultCardCtrl, os.ui.search.FeatureResultCardCtrl);

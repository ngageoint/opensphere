goog.provide('plugin.mapzen.places.ResultCardCtrl');
goog.provide('plugin.mapzen.places.resultCardDirective');

goog.require('goog.async.Delay');
goog.require('ol.extent');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.search.FeatureResultCardCtrl');


/**
 * The geonames result card directive for displaying search results.
 * @return {angular.Directive}
 */
plugin.mapzen.places.resultCardDirective = function() {
  return {
    restrict: 'E',
    templateUrl: os.ROOT + 'views/plugin/mapzen/places/resultcard.html',
    controller: plugin.mapzen.places.ResultCardCtrl,
    controllerAs: 'resultCtrl'
  };
};


/**
 * Register the directive.
 */
os.ui.Module.directive('mapzenplacesresultcard', [plugin.mapzen.places.resultCardDirective]);



/**
 * Controller for the beresultcard directive.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @extends {os.ui.search.FeatureResultCardCtrl}
 * @ngInject
 */
plugin.mapzen.places.ResultCardCtrl = function($scope, $element) {
  plugin.mapzen.places.ResultCardCtrl.base(this, 'constructor', $scope, $element);
};
goog.inherits(plugin.mapzen.places.ResultCardCtrl, os.ui.search.FeatureResultCardCtrl);


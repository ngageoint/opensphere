goog.provide('plugin.google.places.ResultCardCtrl');
goog.provide('plugin.google.places.resultCardDirective');

goog.require('goog.async.Delay');
goog.require('ol.extent');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.search.FeatureResultCardCtrl');


/**
 * The geonames result card directive for displaying search results.
 * @return {angular.Directive}
 */
plugin.google.places.resultCardDirective = function() {
  return {
    replace: true,
    restrict: 'E',
    templateUrl: os.ROOT + 'views/plugin/google/places/resultcard.html',
    controller: plugin.google.places.ResultCardCtrl,
    controllerAs: 'resultCtrl'
  };
};


/**
 * Register the directive.
 */
os.ui.Module.directive('googleplacesresultcard', [plugin.google.places.resultCardDirective]);



/**
 * Controller for the beresultcard directive.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @extends {os.ui.search.FeatureResultCardCtrl}
 * @ngInject
 */
plugin.google.places.ResultCardCtrl = function($scope, $element) {
  plugin.google.places.ResultCardCtrl.base(this, 'constructor', $scope, $element);
};
goog.inherits(plugin.google.places.ResultCardCtrl, os.ui.search.FeatureResultCardCtrl);


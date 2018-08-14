goog.provide('plugin.pelias.geocoder.ResultCardCtrl');
goog.provide('plugin.pelias.geocoder.resultCardDirective');

goog.require('goog.async.Delay');
goog.require('ol.extent');
goog.require('os.defines');
goog.require('os.ui.Module');
goog.require('os.ui.search.FeatureResultCardCtrl');


/**
 * The Pelias geocoder result card directive for displaying search results.
 * @return {angular.Directive}
 */
plugin.pelias.geocoder.resultCardDirective = function() {
  return {
    restrict: 'E',
    templateUrl: os.ROOT + 'views/plugin/pelias/geocoder/resultcard.html',
    controller: plugin.pelias.geocoder.ResultCardCtrl,
    controllerAs: 'resultCtrl'
  };
};


/**
 * Register the directive.
 */
os.ui.Module.directive('peliasgeocoderresultcard', [plugin.pelias.geocoder.resultCardDirective]);


/**
 * Controller for the resultcard directive.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @extends {os.ui.search.FeatureResultCardCtrl}
 * @ngInject
 */
plugin.pelias.geocoder.ResultCardCtrl = function($scope, $element) {
  plugin.pelias.geocoder.ResultCardCtrl.base(this, 'constructor', $scope, $element);
};
goog.inherits(plugin.pelias.geocoder.ResultCardCtrl, os.ui.search.FeatureResultCardCtrl);


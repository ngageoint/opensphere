goog.provide('plugin.pelias.geocoder.AttrCardCtrl');
goog.provide('plugin.pelias.geocoder.attrCardDirective');

goog.require('os.defines');
goog.require('os.ui.Module');


/**
 * The geonames result card directive for displaying search results.
 * @return {angular.Directive}
 */
plugin.pelias.geocoder.attrCardDirective = function() {
  return {
    restrict: 'E',
    templateUrl: os.ROOT + 'views/plugin/pelias/geocoder/attrcard.html',
    controller: plugin.pelias.geocoder.AttrCardCtrl,
    controllerAs: 'attrCtrl'
  };
};


/**
 * Register the directive.
 */
os.ui.Module.directive('peliasgeocoderattrcard', [plugin.pelias.geocoder.attrCardDirective]);



/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
plugin.pelias.geocoder.AttrCardCtrl = function($scope, $element) {
  // just plop the result HTML in
  var attrs = /** @type {plugin.pelias.geocoder.AttrResult} */ ($scope['result']).getResult();

  var html = '';
  for (var i = 0, n = attrs.length; i < n; i++) {
    html += '<div>' + attrs[i] + '</div>';
  }

  var el = $element.find('.attrs');
  el = el.length ? el : $element;
  el.html(html);
};


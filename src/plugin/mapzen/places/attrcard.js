goog.provide('plugin.mapzen.places.AttrCardCtrl');
goog.provide('plugin.mapzen.places.attrCardDirective');

goog.require('os.defines');
goog.require('os.ui.Module');


/**
 * The geonames result card directive for displaying search results.
 * @return {angular.Directive}
 */
plugin.mapzen.places.attrCardDirective = function() {
  return {
    restrict: 'E',
    templateUrl: os.ROOT + 'views/plugin/mapzen/places/attrcard.html',
    controller: plugin.mapzen.places.AttrCardCtrl,
    controllerAs: 'attrCtrl'
  };
};


/**
 * Register the directive.
 */
os.ui.Module.directive('mapzenplacesattrcard', [plugin.mapzen.places.attrCardDirective]);



/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
plugin.mapzen.places.AttrCardCtrl = function($scope, $element) {
  // just plop the result HTML in
  var attrs = /** @type {plugin.mapzen.places.AttrResult} */ ($scope['result']).getResult();

  var html = '';
  for (var i = 0, n = attrs.length; i < n; i++) {
    html += '<div>' + attrs[i] + '</div>';
  }

  var el = $element.find('.attrs');
  el = el.length ? el : $element;
  el.html(html);
};


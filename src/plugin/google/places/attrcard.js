goog.provide('plugin.google.places.AttrCardCtrl');
goog.provide('plugin.google.places.attrCardDirective');

goog.require('os.defines');
goog.require('os.ui.Module');


/**
 * The geonames result card directive for displaying search results.
 * @return {angular.Directive}
 */
plugin.google.places.attrCardDirective = function() {
  return {
    restrict: 'E',
    templateUrl: os.ROOT + 'views/plugin/google/places/attrcard.html',
    controller: plugin.google.places.AttrCardCtrl,
    controllerAs: 'attrCtrl'
  };
};


/**
 * Register the directive.
 */
os.ui.Module.directive('googleplacesattrcard', [plugin.google.places.attrCardDirective]);



/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
plugin.google.places.AttrCardCtrl = function($scope, $element) {
  // just plop the result HTML in
  var attrs = /** @type {plugin.google.places.AttrResult} */ ($scope['result']).getResult();

  var html = '';
  for (var i = 0, n = attrs.length; i < n; i++) {
    html += '<div>' + attrs[i] + '</div>';
  }

  var el = $element.find('.attrs');
  el = el.length ? el : $element;
  el.html(html);
};


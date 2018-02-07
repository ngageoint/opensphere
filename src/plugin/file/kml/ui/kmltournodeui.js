goog.provide('plugin.file.kml.ui.KMLTourNodeUICtrl');
goog.provide('plugin.file.kml.ui.kmlTourNodeUIDirective');

goog.require('os.ui.Module');
goog.require('os.ui.slick.AbstractNodeUICtrl');


/**
 * The node UI for KML tour nodes.
 * @return {angular.Directive}
 */
plugin.file.kml.ui.kmlTourNodeUIDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    template: '<span class="glyphs pull-right slick-node-ui" ng-if="ctrl.show()">' +
        '<span ng-if="!ctrl.isPlaying()" ng-click="ctrl.play()" title="Play the tour">' +
            '<i class="fa fa-fw fa-play glyph"></i></span>' +
        '<span ng-if="ctrl.isPlaying()" ng-click="ctrl.pause()" title="Pause the tour">' +
            '<i class="fa fa-fw fa-pause yellow-icon glyph"></i></span>' +
        '<span ng-click="ctrl.reset()" title="Reset the tour">' +
            '<i class="fa fa-fw fa-undo glyph"></i></span>' +
        '</span>',
    controller: plugin.file.kml.ui.KMLTourNodeUICtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the Angular module
 */
os.ui.Module.directive('kmltournodeui', [plugin.file.kml.ui.kmlTourNodeUIDirective]);



/**
 * Controller for KML tour node UI.
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @extends {os.ui.slick.AbstractNodeUICtrl}
 * @constructor
 * @ngInject
 */
plugin.file.kml.ui.KMLTourNodeUICtrl = function($scope, $element) {
  plugin.file.kml.ui.KMLTourNodeUICtrl.base(this, 'constructor', $scope, $element);
};
goog.inherits(plugin.file.kml.ui.KMLTourNodeUICtrl, os.ui.slick.AbstractNodeUICtrl);


/**
 * Get the KML tour object.
 * @return {plugin.file.kml.tour.Tour|undefined}
 * @protected
 */
plugin.file.kml.ui.KMLTourNodeUICtrl.prototype.getTour = function() {
  var node = /** @type {plugin.file.kml.ui.KMLTourNode} */ (this.scope['item']);
  if (node) {
    return node.getTour();
  }

  return undefined;
};


/**
 * If the tour is playing.
 * @return {boolean}
 */
plugin.file.kml.ui.KMLTourNodeUICtrl.prototype.isPlaying = function() {
  var tour = this.getTour();
  return tour != null && tour['playing'];
};
goog.exportProperty(
    plugin.file.kml.ui.KMLTourNodeUICtrl.prototype,
    'isPlaying',
    plugin.file.kml.ui.KMLTourNodeUICtrl.prototype.isPlaying);


/**
 * Play the tour.
 */
plugin.file.kml.ui.KMLTourNodeUICtrl.prototype.play = function() {
  var tour = this.getTour();
  if (tour) {
    tour.play();
  }
};
goog.exportProperty(
    plugin.file.kml.ui.KMLTourNodeUICtrl.prototype,
    'play',
    plugin.file.kml.ui.KMLTourNodeUICtrl.prototype.play);


/**
 * Pause the tour.
 */
plugin.file.kml.ui.KMLTourNodeUICtrl.prototype.pause = function() {
  var tour = this.getTour();
  if (tour) {
    tour.pause();
  }
};
goog.exportProperty(
    plugin.file.kml.ui.KMLTourNodeUICtrl.prototype,
    'pause',
    plugin.file.kml.ui.KMLTourNodeUICtrl.prototype.pause);


/**
 * Reset the tour.
 */
plugin.file.kml.ui.KMLTourNodeUICtrl.prototype.reset = function() {
  var tour = this.getTour();
  if (tour) {
    tour.reset();
  }
};
goog.exportProperty(
    plugin.file.kml.ui.KMLTourNodeUICtrl.prototype,
    'reset',
    plugin.file.kml.ui.KMLTourNodeUICtrl.prototype.reset);

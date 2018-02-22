goog.provide('plugin.file.kml.ui.KMLTourNodeUICtrl');
goog.provide('plugin.file.kml.ui.kmlTourNodeUIDirective');

goog.require('os.ui.Module');
goog.require('os.ui.slick.AbstractNodeUICtrl');
goog.require('plugin.file.kml.tour.EventType');


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

  /**
   * The KML tour.
   * @type {plugin.file.kml.tour.Tour|undefined}
   * @private
   */
  this.tour_ = this.getTour();

  if (this.tour_) {
    this.tour_.listen(plugin.file.kml.tour.EventType.PLAYING, this.onTourEvent, false, this);
  }
};
goog.inherits(plugin.file.kml.ui.KMLTourNodeUICtrl, os.ui.slick.AbstractNodeUICtrl);


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLTourNodeUICtrl.prototype.destroy = function() {
  plugin.file.kml.ui.KMLTourNodeUICtrl.base(this, 'destroy');

  if (this.tour_) {
    this.tour_.unlisten(plugin.file.kml.tour.EventType.PLAYING, this.onTourEvent, false, this);
    this.tour_ = undefined;
  }
};


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
 * Handle events from the KML tour.
 * @param {!goog.events.Event} event The event.
 * @protected
 */
plugin.file.kml.ui.KMLTourNodeUICtrl.prototype.onTourEvent = function(event) {
  os.ui.apply(this.scope);
};


/**
 * If the tour is playing.
 * @return {boolean}
 */
plugin.file.kml.ui.KMLTourNodeUICtrl.prototype.isPlaying = function() {
  return this.tour_ != null && this.tour_['playing'];
};
goog.exportProperty(
    plugin.file.kml.ui.KMLTourNodeUICtrl.prototype,
    'isPlaying',
    plugin.file.kml.ui.KMLTourNodeUICtrl.prototype.isPlaying);


/**
 * @inheritDoc
 */
plugin.file.kml.ui.KMLTourNodeUICtrl.prototype.show = function() {
  return plugin.file.kml.ui.KMLTourNodeUICtrl.base(this, 'show') || this.isPlaying();
};
goog.exportProperty(
    plugin.file.kml.ui.KMLTourNodeUICtrl.prototype,
    'show',
    plugin.file.kml.ui.KMLTourNodeUICtrl.prototype.show);


/**
 * Play the tour.
 */
plugin.file.kml.ui.KMLTourNodeUICtrl.prototype.play = function() {
  if (this.tour_) {
    this.tour_.play();
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
  if (this.tour_) {
    this.tour_.pause();
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
  if (this.tour_) {
    this.tour_.reset();
  }
};
goog.exportProperty(
    plugin.file.kml.ui.KMLTourNodeUICtrl.prototype,
    'reset',
    plugin.file.kml.ui.KMLTourNodeUICtrl.prototype.reset);

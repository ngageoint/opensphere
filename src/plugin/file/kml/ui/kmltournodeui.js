goog.declareModuleId('plugin.file.kml.ui.KMLTourNodeUI');

import Module from '../../../../os/ui/module.js';
import AbstractNodeUICtrl from '../../../../os/ui/slick/abstractnodeui.js';
import * as ui from '../../../../os/ui/ui.js';
import EventType from '../tour/eventtype.js';


/**
 * The node UI for KML tour nodes.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,

  template: '<span class="slick-node-ui" ng-if="ctrl.show()">' +
      '<span ng-if="!ctrl.isPlaying()" ng-click="ctrl.play()" title="Play the tour">' +
          '<i class="fa fa-fw fa-play c-glyph"></i></span>' +
      '<span ng-if="ctrl.isPlaying()" ng-click="ctrl.pause()" title="Pause the tour">' +
          '<i class="fa fa-fw fa-pause c-glyph"></i></span>' +
      '<span ng-click="ctrl.reset()" title="Reset the tour">' +
          '<i class="fa fa-fw fa-undo c-glyph"></i></span>' +
      '</span>',

  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'kmltournodeui';


/**
 * Add the directive to the Angular module
 */
Module.directive('kmltournodeui', [directive]);



/**
 * Controller for KML tour node UI.
 * @unrestricted
 */
export class Controller extends AbstractNodeUICtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    /**
     * The KML tour.
     * @type {plugin.file.kml.tour.Tour|undefined}
     * @private
     */
    this.tour_ = this.getTour();

    if (this.tour_) {
      this.tour_.listen(EventType.PLAYING, this.onTourEvent, false, this);
    }
  }

  /**
   * @inheritDoc
   */
  destroy() {
    super.destroy();

    if (this.tour_) {
      this.tour_.unlisten(EventType.PLAYING, this.onTourEvent, false, this);
      this.tour_ = undefined;
    }
  }

  /**
   * Get the KML tour object.
   *
   * @return {plugin.file.kml.tour.Tour|undefined}
   * @protected
   */
  getTour() {
    var node = /** @type {plugin.file.kml.ui.KMLTourNode} */ (this.scope['item']);
    if (node) {
      return node.getTour();
    }

    return undefined;
  }

  /**
   * Handle events from the KML tour.
   *
   * @param {!goog.events.Event} event The event.
   * @protected
   */
  onTourEvent(event) {
    ui.apply(this.scope);
  }

  /**
   * If the tour is playing.
   *
   * @return {boolean}
   * @export
   */
  isPlaying() {
    return this.tour_ != null && this.tour_['playing'];
  }

  /**
   * @inheritDoc
   * @export
   */
  show() {
    return super.show() || this.isPlaying();
  }

  /**
   * Play the tour.
   *
   * @export
   */
  play() {
    if (this.tour_) {
      this.tour_.play();
    }
  }

  /**
   * Pause the tour.
   *
   * @export
   */
  pause() {
    if (this.tour_) {
      this.tour_.pause();
    }
  }

  /**
   * Reset the tour.
   *
   * @export
   */
  reset() {
    if (this.tour_) {
      this.tour_.reset();
    }
  }
}

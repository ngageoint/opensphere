goog.declareModuleId('os.ui.LegendUI');

import {listen, unlistenByKey} from 'ol/src/events.js';

import LegendSetting from '../config/legendsetting.js';
import Settings from '../config/settings.js';
import SourceManager from '../data/sourcemanager.js';
import * as dispatcher from '../dispatcher.js';
import LayerEventType from '../events/layereventtype.js';
import AnimatedTile from '../layer/animatedtile.js';
import LayerPropertyChange from '../layer/propertychange.js';
import * as legend from '../legend/legend.js';
import {getMapContainer} from '../map/mapinstance.js';
import {ROOT} from '../os.js';
import SourcePropertyChange from '../source/propertychange.js';
import SettingsManager from './config/settingsmanager.js';
import UIEvent from './events/uievent.js';
import UIEventType from './events/uieventtype.js';
import Module from './module.js';
import * as osWindow from './window.js';

const Throttle = goog.require('goog.async.Throttle');
const nextTick = goog.require('goog.async.nextTick');
const dispose = goog.require('goog.dispose');
const GoogEventType = goog.require('goog.events.EventType');

const {default: LayerEvent} = goog.requireType('os.events.LayerEvent');
const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');
const {default: ILayer} = goog.requireType('os.layer.ILayer');


/**
 * The legend directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'closeFlag': '='
  },
  templateUrl: ROOT + 'views/legend.html',
  controller: Controller,
  controllerAs: 'legend'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'legendguide';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller function for the legend directive
 * @unrestricted
 */
export class Controller extends SourceManager {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super();

    // events that will trigger a legend redraw
    this.updateEvents = [
      SourcePropertyChange.COLOR,
      SourcePropertyChange.COLOR_MODEL,
      SourcePropertyChange.ENABLED,
      SourcePropertyChange.FEATURES,
      SourcePropertyChange.FEATURE_VISIBILITY,
      SourcePropertyChange.GEOMETRY_CENTER_SHAPE,
      SourcePropertyChange.GEOMETRY_SHAPE,
      SourcePropertyChange.STYLE,
      SourcePropertyChange.TITLE,
      SourcePropertyChange.VISIBLE
    ];

    /**
     * Tile layer events that should trigger a UI update.
     * @type {!Array<string>}
     * @protected
     */
    this.tileUpdateEvents = [
      LayerPropertyChange.STYLE,
      LayerPropertyChange.VISIBLE,
      LayerPropertyChange.TITLE
    ];

    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;
    this.scope.$on('$destroy', this.dispose.bind(this));

    /**
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    /**
     * Limit how frequently the legend is updated.
     * @type {Throttle}
     * @protected
     */
    this.drawThrottle = new Throttle(this.drawLegend_, 500, this);

    /**
     * @type {?HTMLCanvasElement}
     * @private
     */
    this.canvas_ = null;

    /**
     * If we're currently dragging the legend.
     * @type {boolean}
     * @private
     */
    this.dragging_ = false;

    /**
     * If we're currently saving the position (so don't update).
     * @type {boolean}
     * @private
     */
    this.saving_ = false;

    /**
     * Map of tile listen keys.
     * @type {Object<string, ol.EventsKey>}
     * @private
     */
    this.layerListeners_ = {};

    this.mapChangeSizeListenKey = null;

    // register the legend as a window so it can be toggled by os.ui.menu.windows.toggleWindow
    osWindow.registerWindow('legend', this.element[0]);

    this.init();
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    // remove from the open window registry
    osWindow.unregisterWindow('legend', this.element[0]);

    dispatcher.getInstance().unlisten(legend.EventType.UPDATE, this.onUpdateDelay, false, this);

    var map = getMapContainer();
    map.unlisten(LayerEventType.ADD, this.onLayerAdded_, false, this);
    map.unlisten(LayerEventType.REMOVE, this.onLayerRemoved_, false, this);

    for (var key in this.layerListeners_) {
      unlistenByKey(this.layerListeners_[key]);
    }

    dispose(this.drawThrottle);
    this.drawThrottle = null;

    var olMap = map.getMap();
    if (olMap) {
      unlistenByKey(this.mapChangeSizeListenKey);
    }

    this.canvas_ = null;
    this.scope = null;
    this.element = null;
  }

  /**
   * @inheritDoc
   */
  init() {
    super.init();

    var canvas = this.element.find('canvas');
    if (canvas && canvas.length == 1) {
      this.canvas_ = /** @type {!HTMLCanvasElement} */ (canvas[0]);
    }

    dispatcher.getInstance().listen(legend.EventType.UPDATE, this.onUpdateDelay, false, this);

    var map = getMapContainer();
    map.listen(LayerEventType.ADD, this.onLayerAdded_, false, this);
    map.listen(LayerEventType.REMOVE, this.onLayerRemoved_, false, this);

    var tileLayers = /** @type {!Array<!AnimatedTile>} */ (map.getLayers().filter(function(layer) {
      return layer instanceof AnimatedTile;
    }));

    for (var i = 0; i < tileLayers.length; i++) {
      this.addLayerListener_(tileLayers[i]);
    }

    var olMap = map.getMap();
    if (olMap) {
      this.mapChangeSizeListenKey = listen(olMap, 'change:size', this.onUpdateDelay, this);
    }

    // positioning off the screen will auto correct to the bottom/right
    var x = /** @type {string} */ (Settings.getInstance().get(LegendSetting.LEFT, '15000px'));
    var y = /** @type {string} */ (Settings.getInstance().get(LegendSetting.TOP, '15000px'));
    this.element.css('left', x);
    this.element.css('top', y);

    this.element.draggable({
      'containment': Controller.CONTAINER_SELECTOR,
      'start': this.onDragStart_.bind(this),
      'stop': this.onDragStop_.bind(this)
    });

    // defer the initial update so the CSS left/top attributes are updated
    nextTick(this.onUpdateDelay, this);
  }

  /**
   * @inheritDoc
   */
  onUpdateDelay() {
    if (!this.saving_ && this.drawThrottle) {
      this.drawThrottle.fire();
    }
  }

  /**
   * Draws the legend.
   *
   * @private
   */
  drawLegend_() {
    if (this.canvas_) {
      // limit the height/width to not exceed the container size
      var container = angular.element(Controller.CONTAINER_SELECTOR);
      var maxHeight = container.height() - 50;
      var maxWidth = container.width() - 50;

      legend.drawToCanvas(this.canvas_, maxHeight, maxWidth);
      this.positionLegend_();
    }
  }

  /**
   * Handle a layer being added to the map.
   *
   * @param {LayerEvent} event The layer event
   * @private
   */
  onLayerAdded_(event) {
    if (event.layer instanceof AnimatedTile) {
      this.addLayerListener_(event.layer);
    }

    this.updateDelay.start();
  }

  /**
   * Handle a layer being remove from the map.
   *
   * @param {LayerEvent} event The layer event
   * @private
   */
  onLayerRemoved_(event) {
    if (event.layer instanceof AnimatedTile) {
      this.removeLayerListener_(event.layer);
    }

    this.updateDelay.start();
  }

  /**
   * Registers change listener on a layer.
   *
   * @param {ILayer} layer
   * @private
   */
  addLayerListener_(layer) {
    this.removeLayerListener_(layer);

    var id = layer.getId();
    this.layerListeners_[id] = listen(/** @type {ol.events.EventTarget} */ (layer),
        GoogEventType.PROPERTYCHANGE, this.onTilePropertyChange, this);
  }

  /**
   * Removes change listener on a layer.
   *
   * @param {ILayer} layer
   * @private
   */
  removeLayerListener_(layer) {
    var id = layer.getId();
    if (id in this.layerListeners_) {
      unlistenByKey(this.layerListeners_[id]);
      delete this.layerListeners_[id];
    }
  }

  /**
   * Handle property change events from a source.
   *
   * @param {PropertyChangeEvent|ol.Object.Event} event
   * @protected
   */
  onTilePropertyChange(event) {
    var p;
    try {
      // ol3's ol.ObjectEventType.PROPERTYCHANGE is the same as goog.events.EventType.PROPERTYCHANGE, so make sure the
      // event is from us
      p = event.getProperty();
    } catch (e) {
      return;
    }

    // update the UI if a flagged event type is fired
    if (p && this.tileUpdateEvents.indexOf(p) > -1) {
      this.updateDelay.start();
    }
  }

  /**
   * Drag start handler. Fires a start event in case the parent needs to take action.
   *
   * @param {?Object} event
   * @param {?Object} ui
   * @private
   */
  onDragStart_(event, ui) {
    // iframes kill mouse events if you roll over them while dragging, so we'll nip that in the bud
    angular.element('iframe').addClass('u-pointer-events-none');
    this.dragging_ = true;
  }

  /**
   * Drag end handler. Fires an end event in case the parent needs to take action.
   *
   * @param {?Object} event
   * @param {?Object} ui
   * @private
   */
  onDragStop_(event, ui) {
    // iframes can have mouse events again
    angular.element('iframe').removeClass('u-pointer-events-none');
    this.dragging_ = false;

    if (this.element) {
      // jQuery draggable will set the height/width, but we want the legend to autosize based on the canvas size
      this.element.height('auto');
      this.element.width('auto');

      // save the new position to settings
      this.savePosition_();

      // update position in case the legend changed size while dragging
      this.positionLegend_();
    }
  }

  /**
   * Saves the legend position to settings.
   *
   * @private
   */
  savePosition_() {
    if (!this.saving_ && this.element && Settings.getInstance()) {
      this.saving_ = true;

      // save the position for next time
      var x = this.element.css('left');
      var y = this.element.css('top');
      Settings.getInstance().set(LegendSetting.LEFT, x);
      Settings.getInstance().set(LegendSetting.TOP, y);

      this.saving_ = false;
    }
  }

  /**
   * Handles viewport/legend resize
   *
   * @param {goog.events.Event=} opt_e
   * @private
   */
  positionLegend_(opt_e) {
    // don't reposition the legend while it's being dragged
    if (!this.dragging_ && this.element) {
      // this moves the legend back into view rather simplistically
      var strX = this.element.css('left').replace('px', '');
      var strY = this.element.css('top').replace('px', '');
      if (isNaN(strX) || isNaN(strY)) {
        // position isn't set yet
        return;
      }

      var x = parseFloat(strX);
      var y = parseFloat(strY);
      var oldX = parseFloat(Settings.getInstance().get(LegendSetting.LEFT, strX).replace('px', ''));
      var oldY = parseFloat(Settings.getInstance().get(LegendSetting.TOP, strY).replace('px', ''));
      var w = parseFloat(this.element.css('width').replace('px', ''));
      var h = parseFloat(this.element.css('height').replace('px', ''));

      var container = angular.element(Controller.CONTAINER_SELECTOR);
      var cHeight = container.height();
      var cWidth = container.width();
      var cTop = container.offset()['top'];

      var changed = false;
      if (x < 0) {
        this.element.css('left', '5px');
        changed = true;
      } else if ((x + w) > cWidth) {
        x = cWidth - w;
        this.element.css('left', x + 'px');
        changed = true;
      }

      if (y < cTop) {
        this.element.css('top', cTop + 'px');
        changed = true;
      } else if ((y + h) > (cTop + cHeight)) {
        y = cTop + cHeight - h;
        this.element.css('top', y + 'px');
        changed = true;
      }

      if (!changed && (oldX != x || oldY != y)) { // adjust until it settles
        this.element.css('left', oldX + 'px');
        this.element.css('top', oldY + 'px');
        this.positionLegend_(opt_e);
      }
    }
  }

  /**
   * Open legend settings.
   *
   * @export
   */
  openSettings() {
    SettingsManager.getInstance().setSelectedPlugin(legend.ID);

    var event = new UIEvent(UIEventType.TOGGLE_UI, 'settings', true);
    dispatcher.getInstance().dispatchEvent(event);
  }

  /**
   * Open legend settings.
   *
   * @export
   */
  close() {
    if (this.scope['closeFlag'] != null) {
      // ng-if
      this.scope['closeFlag'] = !this.scope['closeFlag'];
    } else {
      this.element.remove();

      // parent scope is the one created in os.ui.window.launchInternal, so destroy that to prevent leaks
      this.scope.$parent.$destroy();
    }
  }
}


/**
 * CSS selector for the legend container.
 * @type {string}
 * @const
 */
Controller.CONTAINER_SELECTOR = '#map-container';

goog.declareModuleId('os.interaction.MouseZoom');

import {platformModifierKeyOnly} from 'ol/src/events/condition.js';
import Interaction, {zoomByDelta} from 'ol/src/interaction/Interaction.js';

import I3DSupport from '../i3dsupport.js';
import osImplements from '../implements.js';
import {getMapContainer} from '../map/mapinstance.js';

const {assert} = goog.require('goog.asserts');
const BrowserEvent = goog.require('goog.events.BrowserEvent');
const {clamp} = goog.require('goog.math');

const MOUSEWHEELZOOM_MAXDELTA = 1;

/**
 * Allows the user to pan the map by dragging the map.
 *
 * @implements {I3DSupport}
 */
export default class MouseZoom extends Interaction {
  /**
   * Constructor.
   * @param {olx.interaction.DragPanOptions=} opt_options Options.
   */
  constructor(opt_options) {
    super({
      handleEvent: MouseZoom.handleEvent
    });

    /**
     * @type {Object}
     * @private
     */
    this.lastY_ = {};
  }

  /**
   * @inheritDoc
   */
  is3DSupported() {
    return true;
  }

  /**
   * @param {MapBrowserEvent} mapBrowserEvent Map browser event.
   */
  zoom(mapBrowserEvent) {
    var zoomIncrements = 0.1;

    var delta = 0;
    var coordinate = mapBrowserEvent.coordinate;
    var browserEvent = new BrowserEvent(mapBrowserEvent.originalEvent);

    // Add a little buffer so it doesnt seem like it zooms horizontally
    if (this.lastY_ != null) {
      if (browserEvent.clientY < this.lastY_.low) {
        delta = -zoomIncrements;
      } else if (browserEvent.clientY > this.lastY_.high) {
        delta = zoomIncrements;
      }
      coordinate = mapBrowserEvent.map.getView().getCenter();
    } else {
      this.lastY_ = {
        low: browserEvent.clientY - 5,
        high: browserEvent.clientY + 5
      };
    }

    if (delta != 0) {
      this.lastY_ = {
        low: browserEvent.clientY - 5,
        high: browserEvent.clientY + 5
      };
      var maxDelta = MOUSEWHEELZOOM_MAXDELTA;
      delta = clamp(delta, -maxDelta, maxDelta);
      var map = mapBrowserEvent.map;

      var view = map.getView();
      assert(view !== undefined);

      var mapContainer = getMapContainer();
      if (mapContainer.is3DEnabled()) {
        var camera = mapContainer.getWebGLCamera();
        if (camera) {
          // this will change the zoom level by ~0.1 per call
          camera.zoomByDelta(delta > 0 ? (1 / 0.95) : 0.95);
        }
      } else {
        map.render();
        zoomByDelta(view, -delta, coordinate, 0);
      }
    }
  }

  /**
   * @param {MapBrowserEvent} mapBrowserEvent Map browser event.
   * @return {boolean} `false` to stop event propagation.
   * @this MouseZoom
   */
  static handleEvent(mapBrowserEvent) {
    var stopEvent = false;
    if (mapBrowserEvent.originalEvent instanceof PointerEvent &&
        mapBrowserEvent.originalEvent.buttons == 2 &&
        mapBrowserEvent.dragging &&
        platformModifierKeyOnly(mapBrowserEvent)) {
      this.zoom(mapBrowserEvent);
      stopEvent = true;
    } else {
      // Reset the last y
      this.lastY_ = null;
    }

    return !stopEvent;
  }
}

osImplements(MouseZoom, I3DSupport.ID);

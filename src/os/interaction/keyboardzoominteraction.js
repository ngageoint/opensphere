goog.declareModuleId('os.interaction.KeyboardZoom');

import {shiftKeyOnly} from 'ol/src/events/condition.js';
import EventType from 'ol/src/events/EventType.js';
import {zoomByDelta} from 'ol/src/interaction/Interaction.js';
import OLKeyboardZoom from 'ol/src/interaction/KeyboardZoom.js';

import I3DSupport from '../i3dsupport.js';
import osImplements from '../implements.js';
import {getMapContainer} from '../map/mapinstance.js';
import {KEY_TYPE} from '../ui/ol/interaction/interaction.js';
import {getZoomDelta} from './interaction.js';

const {assert} = goog.require('goog.asserts');
const KeyCodes = goog.require('goog.events.KeyCodes');


/**
 * Extends the OpenLayers keyboard zoom interaction to support WebGL.
 *
 * @implements {I3DSupport}
 */
export default class KeyboardZoom extends OLKeyboardZoom {
  /**
   * Constructor.
   * @param {olx.interaction.KeyboardZoomOptions=} opt_options Options.
   */
  constructor(opt_options) {
    super(opt_options);

    /**
     * The keyCode of the most recent keydown event.
     * @type {number}
     * @private
     */
    this.lastKeyCode_ = 0;
  }

  /**
   * @inheritDoc
   */
  is3DSupported() {
    return true;
  }

  /**
   * Handles the {@link ol.MapBrowserEvent map browser event} if it was a
   * `KeyEvent`, and decides whether to zoom in or out (depending on whether the
   * key pressed was '+' or '-').
   *
   * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
   * @return {boolean} `false` to stop event propagation.
   * @this KeyboardZoom
   * @suppress {accessControls|duplicate}
   */
  handleEvent(mapBrowserEvent) {
    var stopEvent = false;

    // Firefox doesn't always set the keyCode in the 'keypress' event, so save the last code from the 'keydown' event
    if (mapBrowserEvent.type == EventType.KEYDOWN) {
      this.lastKeyCode_ = mapBrowserEvent.originalEvent.keyCode;
    }

    // use the same event as {@link goog.events.KeyHandler}, to prevent Openlayers events from always being handled first
    if (mapBrowserEvent.type == KEY_TYPE) {
      var keyCode = this.lastKeyCode_ || mapBrowserEvent.originalEvent.keyCode;

      if (this.condition_(mapBrowserEvent)) {
        var boost;
        var inverse;
        switch (keyCode) {
          case KeyCodes.DASH:
          case KeyCodes.FF_DASH:
            boost = false;
            inverse = true;
            break;
          case KeyCodes.EQUALS:
          case KeyCodes.FF_EQUALS:
            // treat = as + so you dont have to hit the shift key
            boost = false;
            inverse = false;
            break;
          case KeyCodes.NUM_MINUS:
            boost = shiftKeyOnly(mapBrowserEvent);
            inverse = true;
            break;
          case KeyCodes.NUM_PLUS:
            boost = shiftKeyOnly(mapBrowserEvent);
            inverse = false;
            break;
          case KeyCodes.PAGE_DOWN:
            boost = true;
            inverse = true;
            break;
          case KeyCodes.PAGE_UP:
            boost = true;
            inverse = false;
            break;
          default:
            break;
        }

        if (boost != null && inverse != null) {
          var delta = getZoomDelta(boost, inverse);

          var map = mapBrowserEvent.map;
          map.render();

          var view = map.getView();
          assert(view !== null, 'view should not be null');

          var mapContainer = getMapContainer();
          if (mapContainer.is3DEnabled()) {
            var camera = mapContainer.getWebGLCamera();
            if (camera) {
              camera.zoomByDelta(delta);
            }
          } else {
            zoomByDelta(view, delta, undefined, this.duration_);
          }

          mapBrowserEvent.preventDefault();
          stopEvent = true;
        }
      }
    }
    return !stopEvent;
  }
}

osImplements(KeyboardZoom, I3DSupport.ID);

goog.declareModuleId('os.interaction.KeyboardTiltRotate');

import {noModifierKeys, shiftKeyOnly, targetNotEditable} from 'ol/src/events/condition.js';
import EventType from 'ol/src/events/EventType.js';
import Interaction from 'ol/src/interaction/Interaction.js';
import {transform} from 'ol/src/proj.js';

import I3DSupport from '../i3dsupport.js';
import osImplements from '../implements.js';
import * as osMap from '../map/map.js';
import {getMapContainer} from '../map/mapinstance.js';
import {EPSG4326} from '../proj/proj.js';
import {KEY_TYPE} from '../ui/ol/interaction/interaction.js';
import {ROTATE_DELTA} from './interaction.js';

const {assert} = goog.require('goog.asserts');
const KeyCodes = goog.require('goog.events.KeyCodes');
const {and} = goog.require('goog.functions');
const {toRadians} = goog.require('goog.math');


/**
 * Interaction to tilt/rotate/spin the 3D globe with the keyboard.
 *
 * @implements {I3DSupport}
 */
export default class KeyboardTiltRotate extends Interaction {
  /**
   * Constructor.
   * @param {olx.interaction.MouseWheelZoomOptions=} opt_options Options.
   */
  constructor(opt_options) {
    var options = opt_options || {};

    super({
      handleEvent: KeyboardTiltRotate.handleEvent
    });

    /**
     * The keyCode of the most recent keydown event.
     * @type {number}
     * @private
     */
    this.lastKeyCode_ = 0;

    /**
     * Condition to trigger handling the event.
     * @type {ol.EventsConditionType}
     * @private
     */
    this.condition_ = options.condition != null ? options.condition :
      and(noModifierKeys, targetNotEditable);
  }

  /**
   * Tilt the globe.
   *
   * @param {MapBrowserEvent} mapBrowserEvent Map browser event
   * @return {boolean}
   */
  tilt(mapBrowserEvent) {
    var stopEvent = false;

    // Tilt only supported in 3D
    var mapContainer = getMapContainer();
    if (mapContainer.is3DEnabled()) {
      var camera = mapContainer.getWebGLCamera();
      if (camera) {
        var keyCode = mapBrowserEvent.originalEvent.keyCode;
        var mapUnitsDelta = .05;
        var delta = 0;

        if (keyCode == KeyCodes.DOWN) {
          delta = mapUnitsDelta;
        } else {
          delta = -mapUnitsDelta;
        }

        camera.setTilt(camera.getTilt() + delta);
        stopEvent = true;
      }
    }
    return stopEvent;
  }

  /**
   * Rotate the globe.
   *
   * @param {MapBrowserEvent} mapBrowserEvent Map browser event.
   * @return {boolean}
   */
  rotate(mapBrowserEvent) {
    var keyCode = mapBrowserEvent.originalEvent.keyCode;
    var stopEvent = false;

    var mapContainer = getMapContainer();
    if (mapContainer.is3DEnabled()) {
      var camera = mapContainer.getWebGLCamera();
      if (camera) {
        if (keyCode == KeyCodes.LEFT) {
          camera.twistLeft();
        } else {
          camera.twistRight();
        }

        stopEvent = true;
      }
    } else {
      var view = mapContainer.getMap().getView();
      if (view) {
        var rotation = view.getRotation();
        if (keyCode == KeyCodes.LEFT) {
          rotation += ROTATE_DELTA;
        } else {
          rotation -= ROTATE_DELTA;
        }

        view.setRotation(rotation);

        stopEvent = true;
      }
    }

    return stopEvent;
  }

  /**
   * Spin the globe.
   *
   * @param {MapBrowserEvent} mapBrowserEvent Map browser event.
   * @return {boolean}
   */
  spin(mapBrowserEvent) {
    var stopEvent = false;

    // Spin only supported in 3D
    var mapContainer = getMapContainer();
    if (mapContainer.is3DEnabled()) {
      var camera = mapContainer.getWebGLCamera();
      if (camera) {
        var keyCode = mapBrowserEvent.originalEvent.keyCode;

        var view = mapContainer.getMap().getView();
        assert(view !== null, 'view should not be null');
        var viewState = view.getState();

        // transform the resolution to degrees, then to radians for the camera
        var ll = transform([viewState.resolution, 0], osMap.PROJECTION, EPSG4326);
        var mapUnitsDelta = toRadians(ll[0] * KeyboardTiltRotate.SPIN_DELTA);

        switch (keyCode) {
          case KeyCodes.UP:
            camera.rotateDown(mapUnitsDelta);
            break;
          case KeyCodes.DOWN:
            camera.rotateUp(mapUnitsDelta);
            break;
          case KeyCodes.LEFT:
            camera.rotateLeft(mapUnitsDelta);
            break;
          case KeyCodes.RIGHT:
            camera.rotateRight(mapUnitsDelta);
            break;
          default:
            break;
        }

        stopEvent = true;
      }
    }

    return stopEvent;
  }

  /**
   * @inheritDoc
   */
  is3DSupported() {
    return true;
  }

  /**
   * Handle the map browser event.
   *
   * @param {MapBrowserEvent} mapBrowserEvent Map browser event.
   * @return {boolean} `false` to stop event propagation.
   * @this KeyboardTiltRotate
   */
  static handleEvent(mapBrowserEvent) {
    // Firefox doesn't always set the keyCode in the 'keypress' event, so save the last code from the 'keydown' event
    if (mapBrowserEvent.type == EventType.KEYDOWN) {
      this.lastKeyCode_ = mapBrowserEvent.originalEvent.keyCode;
    }

    // use the same event as {@link goog.events.KeyHandler}, to prevent Openlayers events from always being handled first
    var stopEvent = false;
    if (mapBrowserEvent.type == KEY_TYPE) {
      var keyCode = this.lastKeyCode_ || mapBrowserEvent.originalEvent.keyCode;

      if (keyCode == KeyCodes.LEFT ||
          keyCode == KeyCodes.RIGHT) {
        if (this.condition_(mapBrowserEvent)) {
          stopEvent = this.spin(mapBrowserEvent);
        } else if (shiftKeyOnly(mapBrowserEvent)) {
          stopEvent = this.rotate(mapBrowserEvent);
        }
      } else if (keyCode == KeyCodes.DOWN || keyCode == KeyCodes.UP) {
        if (this.condition_(mapBrowserEvent)) {
          stopEvent = this.spin(mapBrowserEvent);
        } else if (shiftKeyOnly(mapBrowserEvent)) {
          stopEvent = this.tilt(mapBrowserEvent);
        }
      }
    }

    if (stopEvent) {
      mapBrowserEvent.preventDefault();
    }

    return !stopEvent;
  }
}

osImplements(KeyboardTiltRotate, I3DSupport.ID);

/**
 * Multiplier to use when spinning the globe. This is based off of using the view resolution, which is measured in
 * units per pixel.
 * @type {number}
 * @const
 */
KeyboardTiltRotate.SPIN_DELTA = 100;

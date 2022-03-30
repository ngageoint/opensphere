goog.declareModuleId('os.interaction.KeyboardPan');

import {rotate} from 'ol/src/coordinate.js';
import EventType from 'ol/src/events/EventType.js';
import KeyCode from 'ol/src/events/KeyCode.js';
import {pan} from 'ol/src/interaction/Interaction.js';
import OLKeyboardPan from 'ol/src/interaction/KeyboardPan.js';

import I3DSupport from '../i3dsupport.js';
import osImplements from '../implements.js';
import {KEY_TYPE} from '../ui/ol/interaction/interaction.js';



/**
 * @implements {I3DSupport}
 */
export default class KeyboardPan extends OLKeyboardPan {
  /**
   * Constructor.
   * @param {olx.interaction.KeyboardPanOptions=} opt_options Options.
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
    return false;
  }
}

osImplements(KeyboardPan, I3DSupport.ID);

/**
 * Handles the {@link ol.MapBrowserEvent map browser event} if it was a
 * `KeyEvent`, and decides the direction to pan to (if an arrow key was
 * pressed).
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this KeyboardPan
 *
 * @suppress {accessControls|duplicate}
 */
OLKeyboardPan.handleEvent = function(mapBrowserEvent) {
  var stopEvent = false;

  // Firefox doesn't always set the keyCode in the 'keypress' event, so save the last code from the 'keydown' event
  if (mapBrowserEvent.type == EventType.KEYDOWN) {
    this.lastKeyCode_ = mapBrowserEvent.originalEvent.keyCode;
  }

  // use the same event as {@link goog.events.KeyHandler}, to prevent Openlayers events from always being handled first
  if (mapBrowserEvent.type == KEY_TYPE) {
    var keyCode = this.lastKeyCode_ || mapBrowserEvent.originalEvent.keyCode;

    if (this.condition_(mapBrowserEvent) &&
        (keyCode == KeyCode.DOWN ||
        keyCode == KeyCode.LEFT ||
        keyCode == KeyCode.RIGHT ||
        keyCode == KeyCode.UP)) {
      var map = mapBrowserEvent.map;
      var view = map.getView();
      var mapUnitsDelta = view.getResolution() * this.pixelDelta_;
      var deltaX = 0;
      var deltaY = 0;
      if (keyCode == KeyCode.DOWN) {
        deltaY = -mapUnitsDelta;
      } else if (keyCode == KeyCode.LEFT) {
        deltaX = -mapUnitsDelta;
      } else if (keyCode == KeyCode.RIGHT) {
        deltaX = mapUnitsDelta;
      } else {
        deltaY = mapUnitsDelta;
      }
      var delta = [deltaX, deltaY];
      rotate(delta, view.getRotation());
      pan(view, delta, this.duration_);
      mapBrowserEvent.preventDefault();
      stopEvent = true;
    }
  }
  return !stopEvent;
};

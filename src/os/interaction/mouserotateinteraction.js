goog.declareModuleId('os.interaction.MouseRotate');

import {noModifierKeys} from 'ol/src/events/condition.js';
import Interaction from 'ol/src/interaction/Interaction.js';

import I3DSupport from '../i3dsupport.js';
import osImplements from '../implements.js';
import {ROTATE_DELTA} from './interaction.js';

const {assert} = goog.require('goog.asserts');
const BrowserEvent = goog.require('goog.events.BrowserEvent');


/**
 * Pixel tolerance to reduce how often the map is rotated.
 * @type {number}
 */
const tolerance = 3;


/**
 * Allows the user to pan the map by dragging the map.
 *
 * @implements {I3DSupport}
 */
export default class MouseRotate extends Interaction {
  /**
   * Constructor.
   * @param {olx.interaction.DragPanOptions=} opt_options Options.
   */
  constructor(opt_options) {
    super({
      handleEvent: MouseRotate.handleEvent
    });

    /**
     * The last clientX value handled by the interaction.
     * @type {number}
     * @private
     */
    this.lastX_ = NaN;
  }

  /**
   * @inheritDoc
   */
  is3DSupported() {
    return false;
  }

  /**
   * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
   */
  rotate(mapBrowserEvent) {
    const browserEvent = new BrowserEvent(mapBrowserEvent.originalEvent);
    let delta = 0;

    if (!isNaN(this.lastX_)) {
      if (browserEvent.clientX < this.lastX_ - tolerance) {
        delta = -ROTATE_DELTA;
      } else if (browserEvent.clientX > this.lastX_ + tolerance) {
        delta = ROTATE_DELTA;
      }
    } else {
      this.lastX_ = browserEvent.clientX;
    }

    if (delta != 0 && mapBrowserEvent.map) {
      this.lastX_ = browserEvent.clientX;

      const view = mapBrowserEvent.map.getView();
      assert(view !== undefined);

      mapBrowserEvent.map.render();

      const rotation = view.getRotation();
      view.setRotation(rotation - delta);
    }
  }

  /**
   * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
   * @return {boolean} `false` to stop event propagation.
   * @this os.interaction.MouseRotate
   */
  static handleEvent(mapBrowserEvent) {
    var stopEvent = false;
    if (mapBrowserEvent.originalEvent &&
        mapBrowserEvent.originalEvent.buttons == 2 &&
        mapBrowserEvent.dragging &&
        noModifierKeys(mapBrowserEvent)) {
      this.rotate(mapBrowserEvent);
      stopEvent = true;
    } else {
      // Reset the last y
      this.lastX_ = NaN;
    }

    return !stopEvent;
  }
}

osImplements(MouseRotate, I3DSupport.ID);

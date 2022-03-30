goog.declareModuleId('os.ui.ol.interaction.AbstractDrag');

import {mouseOnly} from 'ol/src/events/condition.js';
import MapBrowserEvent from 'ol/src/MapBrowserEvent.js';
import MapBrowserEventType from 'ol/src/MapBrowserEventType.js';

import AbstractDraw from './abstractdrawinteraction.js';


/**
 * @abstract
 */
export default class AbstractDrag extends AbstractDraw {
  /**
   * Constructor.
   * @param {olx.interaction.PointerOptions=} opt_options
   */
  constructor(opt_options) {
    opt_options = opt_options || {};
    super(opt_options);

    this.handleEvent = this.handleEvent_;
    this.handleDownEvent = this.handleDownEvent_;
    this.handleUpEvent = this.handleUpEvent_;
    this.handleDragEvent = this.handleDragEvent_;

    /**
     * @type {ol.Coordinate}
     * @protected
     */
    this.startCoord = null;
  }

  /**
   * @inheritDoc
   */
  begin(mapBrowserEvent) {
    super.begin(mapBrowserEvent);
    this.startCoord = mapBrowserEvent.coordinate;
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    super.cleanup();
    this.startCoord = null;
  }

  /**
   * @param {ol.MapBrowserEvent} mapBrowserEvent Event.
   * @this DrawPolygon
   * @return {boolean}
   * @private
   * @suppress {accessControls}
   */
  handleEvent_(mapBrowserEvent) {
    if (!(mapBrowserEvent instanceof MapBrowserEvent)) {
      return true;
    }

    let stopEvent = false;
    this.updateTrackedPointers_(mapBrowserEvent);
    if (this.handlingDownUpSequence) {
      if (mapBrowserEvent.type == MapBrowserEventType.POINTERDRAG) {
        this.handleDragEvent(mapBrowserEvent);
        // prevent page scrolling during dragging
        mapBrowserEvent.originalEvent.preventDefault();
      } else if (mapBrowserEvent.type == MapBrowserEventType.POINTERUP) {
        const handledUp = this.handleUpEvent(mapBrowserEvent);
        this.handlingDownUpSequence =
          handledUp && this.targetPointers.length > 0;
      }
    } else if (mapBrowserEvent.type == MapBrowserEventType.POINTERDOWN) {
      const handled = this.handleDownEvent(mapBrowserEvent);
      this.handlingDownUpSequence = handled;
      stopEvent = this.stopDown(handled);
    }

    return !stopEvent;
  }

  /**
   * Handle down event
   *
   * @param {MapBrowserPointerEvent} mapBrowserEvent
   * @return {boolean} Whether or not to start the drag sequence
   * @this AbstractDrag
   * @override
   */
  handleDownEvent_(mapBrowserEvent) {
    if (!mouseOnly(mapBrowserEvent) || this.getOtherDrawing()) {
      return false;
    }

    if (mapBrowserEvent.originalEvent.button === 0 && this.condition(mapBrowserEvent)) {
      this.begin(mapBrowserEvent);
      this.update(mapBrowserEvent);
      return true;
    } else {
      return false;
    }
  }

  /**
   * @param {MapBrowserPointerEvent} mapBrowserEvent
   * @this AbstractDrag
   * @override
   */
  handleDragEvent_(mapBrowserEvent) {
    if (mouseOnly(mapBrowserEvent)) {
      this.update(mapBrowserEvent);
    }
  }

  /**
   * @param {MapBrowserPointerEvent} mapBrowserEvent
   * @return {boolean} Whether or not to stop the drag sequence
   * @this AbstractDrag
   * @override
   */
  handleUpEvent_(mapBrowserEvent) {
    if (!mouseOnly(mapBrowserEvent)) {
      return true;
    }

    this.update(mapBrowserEvent);

    var deltaX = 0;
    var deltaY = 0;

    if (this.startCoord) {
      var px = this.getMap().getPixelFromCoordinate(this.startCoord);
      var px2 = mapBrowserEvent.pixel;

      deltaX = px2[0] - px[0];
      deltaY = px2[1] - px[1];
    }

    if (deltaX * deltaX + deltaY * deltaY >= AbstractDrag.MIN_AREA) {
      this.end(mapBrowserEvent);
    } else {
      this.cancel();
    }

    return true;
  }
}


/**
 * Minimum area to complete the draw interaction, otherwise it will be cancelled.
 * @type {number}
 * @const
 */
AbstractDrag.MIN_AREA = 64;

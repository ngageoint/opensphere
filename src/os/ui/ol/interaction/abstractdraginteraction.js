goog.module('os.ui.ol.interaction.AbstractDrag');
goog.module.declareLegacyNamespace();

const {mouseOnly} = goog.require('ol.events.condition');
const AbstractDraw = goog.require('os.ui.ol.interaction.AbstractDraw');

const MapBrowserPointerEvent = goog.requireType('ol.MapBrowserPointerEvent');


/**
 * @abstract
 */
class AbstractDrag extends AbstractDraw {
  /**
   * Constructor.
   * @param {olx.interaction.PointerOptions=} opt_options
   */
  constructor(opt_options) {
    opt_options = opt_options || {};
    opt_options.handleDownEvent = AbstractDrag.handleDownEvent;
    opt_options.handleUpEvent = AbstractDrag.handleUpEvent;
    opt_options.handleDragEvent = AbstractDrag.handleDragEvent;

    super(opt_options);

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
   * Handle down event
   *
   * @param {MapBrowserPointerEvent} mapBrowserEvent
   * @return {boolean} Whether or not to start the drag sequence
   * @this AbstractDrag
   * @override
   */
  static handleDownEvent(mapBrowserEvent) {
    if (!mouseOnly(mapBrowserEvent)) {
      return false;
    }

    if (mapBrowserEvent.pointerEvent.button === 0 && this.condition(mapBrowserEvent)) {
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
  static handleDragEvent(mapBrowserEvent) {
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
  static handleUpEvent(mapBrowserEvent) {
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

exports = AbstractDrag;

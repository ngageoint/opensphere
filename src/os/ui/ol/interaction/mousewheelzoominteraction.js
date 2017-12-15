goog.provide('os.ui.ol.interaction.MouseWheelZoom');
goog.require('goog.asserts');
goog.require('ol.events.EventType');
goog.require('ol.interaction.Interaction');
goog.require('ol.interaction.MouseWheelZoom');



/**
 * Overridden to use smaller zoom increments
 * @constructor
 * @extends {ol.interaction.MouseWheelZoom}
 * @param {olx.interaction.MouseWheelZoomOptions=} opt_options Options.
 */
os.ui.ol.interaction.MouseWheelZoom = function(opt_options) {
  os.ui.ol.interaction.MouseWheelZoom.base(this, 'constructor', opt_options);
};
goog.inherits(os.ui.ol.interaction.MouseWheelZoom, ol.interaction.MouseWheelZoom);


/**
 * Override to reduce {@link ol.MOUSEWHEELZOOM_TIMEOUT_DURATION} so it doesn't feel so sluggish. It may still feel
 * insane on OSX...
 *
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this ol.interaction.MouseWheelZoom
 *
 * @suppress {accessControls|duplicate} Replacing a static function from OL3.
 */
ol.interaction.MouseWheelZoom.handleEvent = function(mapBrowserEvent) {
  var stopEvent = false;
  if (mapBrowserEvent.type == ol.events.EventType.WHEEL || mapBrowserEvent.type == ol.events.EventType.MOUSEWHEEL) {
    // only handle the event if no modifier keys are held down, but still block the event if they are. this will prevent
    // accidentally zooming the browser when the event is handled by the canvas.
    if (ol.events.condition.noModifierKeys(mapBrowserEvent)) {
      var map = mapBrowserEvent.map;
      var wheelEvent = /** @type {WheelEvent} */ (mapBrowserEvent.originalEvent);

      if (this.useAnchor_) {
        this.lastAnchor_ = mapBrowserEvent.coordinate;
      }

      // Delta normalisation inspired by
      // https://github.com/mapbox/mapbox-gl-js/blob/001c7b9/js/ui/handler/scroll_zoom.js
      // TODO There's more good stuff in there for inspiration to improve this interaction.
      var delta;
      if (mapBrowserEvent.type == ol.events.EventType.WHEEL) {
        // treat horizontal scroll the same as normal scroll
        delta = wheelEvent.deltaY || wheelEvent.deltaX;

        if (ol.has.FIREFOX &&
            wheelEvent.deltaMode === goog.global.WheelEvent.DOM_DELTA_PIXEL) {
          delta /= ol.has.DEVICE_PIXEL_RATIO;
        }
        if (wheelEvent.deltaMode === goog.global.WheelEvent.DOM_DELTA_LINE) {
          delta *= 40;
        }
      } else if (mapBrowserEvent.type == ol.events.EventType.MOUSEWHEEL) {
        delta = -wheelEvent.wheelDeltaY;
        if (ol.has.SAFARI) {
          delta /= 3;
        }
      }

      this.delta_ += delta;

      if (this.startTime_ === undefined) {
        this.startTime_ = Date.now();
      }

      var duration = 10;
      var timeLeft = Math.max(duration - (Date.now() - this.startTime_), 0);

      goog.global.clearTimeout(this.timeoutId_);
      this.timeoutId_ = goog.global.setTimeout(this.doZoom_.bind(this, map), timeLeft);
    }

    mapBrowserEvent.preventDefault();
    stopEvent = true;
  }
  return !stopEvent;
};


/**
 * Override to remove the zoom animation and lock the zoom to increments of 0.2 zoom levels.
 * @param {ol.PluggableMap} map Map.
 * @private
 *
 * @suppress {accessControls|duplicate} Replacing a private function from OL3.
 */
ol.interaction.MouseWheelZoom.prototype.doZoom_ = function(map) {
  var view = map.getView();
  if (view) {
    var delta = this.delta_ > 0 ? 0.2 : -0.2;
    map.render();
    ol.interaction.Interaction.zoomByDelta(view, -delta, this.lastAnchor_);
  }

  this.delta_ = 0;
  this.lastAnchor_ = null;
  this.startTime_ = undefined;
  this.timeoutId_ = undefined;
};

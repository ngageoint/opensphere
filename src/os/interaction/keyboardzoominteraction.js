goog.provide('os.interaction.KeyboardZoom');

goog.require('goog.events.KeyCodes');
goog.require('ol.events.EventType');
goog.require('ol.interaction.KeyboardZoom');
goog.require('os.I3DSupport');
goog.require('os.interaction');
goog.require('os.ui.ol.interaction');



/**
 * Extends the OpenLayers keyboard zoom interaction to support WebGL.
 * @param {olx.interaction.KeyboardZoomOptions=} opt_options Options.
 * @extends {ol.interaction.KeyboardZoom}
 * @implements {os.I3DSupport}
 * @constructor
 */
os.interaction.KeyboardZoom = function(opt_options) {
  os.interaction.KeyboardZoom.base(this, 'constructor', opt_options);

  /**
   * The keyCode of the most recent keydown event.
   * @type {number}
   * @private
   */
  this.lastKeyCode_ = 0;
};
goog.inherits(os.interaction.KeyboardZoom, ol.interaction.KeyboardZoom);


/**
 * @inheritDoc
 */
os.interaction.KeyboardZoom.prototype.is3DSupported = function() {
  return true;
};


/**
 * Handles the {@link ol.MapBrowserEvent map browser event} if it was a
 * `KeyEvent`, and decides whether to zoom in or out (depending on whether the
 * key pressed was '+' or '-').
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this os.interaction.KeyboardZoom
 * @suppress {accessControls|duplicate}
 */
ol.interaction.KeyboardZoom.handleEvent = function(mapBrowserEvent) {
  var stopEvent = false;

  // Firefox doesn't always set the keyCode in the 'keypress' event, so save the last code from the 'keydown' event
  if (mapBrowserEvent.type == ol.events.EventType.KEYDOWN) {
    this.lastKeyCode_ = mapBrowserEvent.originalEvent.keyCode;
  }

  // use the same event as {@link goog.events.KeyHandler}, to prevent Openlayers events from always being handled first
  if (mapBrowserEvent.type == os.ui.ol.interaction.KEY_TYPE) {
    var keyCode = this.lastKeyCode_ || mapBrowserEvent.originalEvent.keyCode;

    if (this.condition_(mapBrowserEvent)) {
      var boost;
      var inverse;
      switch (keyCode) {
        case goog.events.KeyCodes.DASH:
        case goog.events.KeyCodes.FF_DASH:
          boost = false;
          inverse = true;
          break;
        case goog.events.KeyCodes.EQUALS:
        case goog.events.KeyCodes.FF_EQUALS:
          // treat = as + so you dont have to hit the shift key
          boost = false;
          inverse = false;
          break;
        case goog.events.KeyCodes.NUM_MINUS:
          boost = ol.events.condition.shiftKeyOnly(mapBrowserEvent);
          inverse = true;
          break;
        case goog.events.KeyCodes.NUM_PLUS:
          boost = ol.events.condition.shiftKeyOnly(mapBrowserEvent);
          inverse = false;
          break;
        case goog.events.KeyCodes.PAGE_DOWN:
          boost = true;
          inverse = true;
          break;
        case goog.events.KeyCodes.PAGE_UP:
          boost = true;
          inverse = false;
          break;
        default:
          break;
      }

      if (boost != null && inverse != null) {
        var delta = os.interaction.getZoomDelta(boost, inverse);

        var map = mapBrowserEvent.map;
        map.render();

        var view = map.getView();
        goog.asserts.assert(!goog.isNull(view), 'view should not be null');

        var mapContainer = os.MapContainer.getInstance();
        if (mapContainer.is3DEnabled()) {
          var camera = mapContainer.getWebGLCamera();
          if (camera) {
            camera.zoomByDelta(delta);
          }
        } else {
          ol.interaction.Interaction.zoomByDelta(view, delta, undefined, this.duration_);
        }

        mapBrowserEvent.preventDefault();
        stopEvent = true;
      }
    }
  }
  return !stopEvent;
};

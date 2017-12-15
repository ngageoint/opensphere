goog.provide('os.interaction.MouseZoom');

goog.require('goog.asserts');
goog.require('goog.events.BrowserEvent');
goog.require('ol.coordinate');
goog.require('ol.events.condition');
goog.require('ol.interaction.Interaction');
goog.require('os.I3DSupport');



/**
 * Allows the user to pan the map by dragging the map.
 *
 * @constructor
 * @implements {os.I3DSupport}
 * @extends {ol.interaction.Interaction}
 * @param {olx.interaction.DragPanOptions=} opt_options Options.
 */
os.interaction.MouseZoom = function(opt_options) {
  os.interaction.MouseZoom.base(this, 'constructor', {
    handleEvent: os.interaction.MouseZoom.handleEvent
  });

  /**
   * @type {Object}
   * @private
   */
  this.lastY_ = {};
};
goog.inherits(os.interaction.MouseZoom, ol.interaction.Interaction);


/**
 * @inheritDoc
 */
os.interaction.MouseZoom.prototype.is3DSupported = function() {
  return true;
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 */
os.interaction.MouseZoom.prototype.zoom = function(mapBrowserEvent) {
  var zoomIncrements = 0.1;

  var delta = 0;
  var coordinate = mapBrowserEvent.coordinate;
  var browserEvent = new goog.events.BrowserEvent(mapBrowserEvent.originalEvent);

  // Add a little buffer so it doesnt seem like it zooms horizontally
  if (goog.isDefAndNotNull(this.lastY_)) {
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
    var maxDelta = ol.MOUSEWHEELZOOM_MAXDELTA;
    delta = goog.math.clamp(delta, -maxDelta, maxDelta);
    var map = mapBrowserEvent.map;

    var view = map.getView();
    goog.asserts.assert(goog.isDef(view));

    var mapContainer = os.MapContainer.getInstance();
    if (mapContainer.is3DEnabled()) {
      var camera = mapContainer.getCesiumCamera();
      if (camera) {
        // this will change the zoom level by ~0.1 per call
        camera.zoomByDelta(delta > 0 ? (1 / 0.95) : 0.95);
      }
    } else {
      map.render();
      ol.interaction.Interaction.zoomByDelta(view, -delta, coordinate);
    }
  }
};


/**
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this os.interaction.MouseZoom
 */
os.interaction.MouseZoom.handleEvent = function(mapBrowserEvent) {
  var stopEvent = false;
  if (mapBrowserEvent.pointerEvent &&
      mapBrowserEvent.pointerEvent.buttons == 2 &&
      mapBrowserEvent.dragging &&
      mapBrowserEvent.originalEvent.ctrlKey) {
    this.zoom(mapBrowserEvent);
    stopEvent = true;
  } else {
    // Reset the last y
    this.lastY_ = null;
  }

  return !stopEvent;
};

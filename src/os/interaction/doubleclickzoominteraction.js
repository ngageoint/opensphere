goog.provide('os.interaction.DoubleClickZoom');

goog.require('ol.MapBrowserEventType');
goog.require('ol.interaction.DoubleClickZoom');
goog.require('os.I3DSupport');



/**
 * @constructor
 * @implements {os.I3DSupport}
 * @extends {ol.interaction.DoubleClickZoom}
 * @param {olx.interaction.DoubleClickZoomOptions=} opt_options Options.
 */
os.interaction.DoubleClickZoom = function(opt_options) {
  os.interaction.DoubleClickZoom.base(this, 'constructor', opt_options);
};
goog.inherits(os.interaction.DoubleClickZoom, ol.interaction.DoubleClickZoom);


/**
 * Handles the {@link ol.MapBrowserEvent map browser event} (if it was a
 * doubleclick) and eventually zooms the map.
 * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
 * @return {boolean} `false` to stop event propagation.
 * @this os.interaction.DoubleClickZoom
 * @suppress {accessControls|duplicate}
 */
ol.interaction.DoubleClickZoom.handleEvent = function(mapBrowserEvent) {
  var stopEvent = false;

  if (mapBrowserEvent.type == ol.MapBrowserEventType.DBLCLICK) {
    var anchor = mapBrowserEvent.coordinate;

    var mapContainer = os.MapContainer.getInstance();
    if (mapContainer.is3DEnabled()) {
      var camera = mapContainer.getCesiumCamera();
      if (camera) {
        var currentAltitude = camera.getAltitude();
        var altitude = mapBrowserEvent.originalEvent.ctrlKey ? (currentAltitude * 2) : (currentAltitude / 2);

        camera.flyTo(/** @type {!osx.map.FlyToOptions} */ ({
          center: anchor,
          altitude: altitude,
          duration: this.duration_
        }));
      }
    } else {
      var delta = mapBrowserEvent.originalEvent.ctrlKey ? -this.delta_ : this.delta_;
      var view = mapBrowserEvent.map.getView();
      if (view) {
        ol.interaction.Interaction.zoomByDelta(view, delta, anchor, this.duration_);
      }
    }

    mapBrowserEvent.preventDefault();
    stopEvent = true;
  }
  return !stopEvent;
};


/**
 * @inheritDoc
 */
os.interaction.DoubleClickZoom.prototype.is3DSupported = function() {
  return true;
};

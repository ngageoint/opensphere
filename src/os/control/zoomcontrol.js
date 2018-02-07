goog.provide('os.control.Zoom');

goog.require('ol.control.Zoom');
goog.require('os.interaction');



/**
 * Overrides the OL3 zoom control to allow zooming in/out in Cesium.
 *
 * @param {olx.control.ZoomOptions=} opt_options Zoom options.
 * @extends {ol.control.Zoom}
 * @constructor
 */
os.control.Zoom = function(opt_options) {
  os.control.Zoom.base(this, 'constructor', opt_options);
};
goog.inherits(os.control.Zoom, ol.control.Zoom);


/**
 * @inheritDoc
 * @suppress {accessControls}
 */
os.control.Zoom.prototype.zoomByDelta_ = function(delta) {
  var mapContainer = os.MapContainer.getInstance();
  if (mapContainer.is3DEnabled()) {
    var camera = mapContainer.getCesiumCamera();
    if (camera) {
      delta = os.interaction.getZoomDelta(true, delta < 0);
      camera.zoomByDelta(delta);
    }
  } else {
    os.control.Zoom.superClass_.zoomByDelta_.call(this, delta);
  }
};

goog.provide('os.interaction.PinchZoom');

goog.require('ol.interaction.PinchZoom');
goog.require('os.I3DSupport');


/**
 * Handles the behavior of pinch zooming.
 * @constructor
 * @extends {ol.interaction.PinchZoom}
 * @implements {os.I3DSupport}
 * @param {olx.interaction.PinchZoomOptions=} opt_options Options.
 */
os.interaction.PinchZoom = function(opt_options) {
  os.interaction.PinchZoom.base(this, 'constructor', opt_options);
};
goog.inherits(os.interaction.PinchZoom, ol.interaction.PinchZoom);


/**
 * @inheritDoc
 */
os.interaction.PinchZoom.prototype.is3DSupported = function() {
  // Disabled in 3D mode, because Cesium already handles this
  return false;
};

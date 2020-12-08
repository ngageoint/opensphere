goog.module('plugin.cesium.interaction');
goog.module.declareLegacyNamespace();

const map = goog.require('os.map');
const dragbox = goog.require('plugin.cesium.interaction.dragbox');
const dragcircle = goog.require('plugin.cesium.interaction.dragcircle');
const drawpolygon = goog.require('plugin.cesium.interaction.drawpolygon');
const measure = goog.require('plugin.cesium.interaction.measure');


/**
 * Configure Cesium interactions.
 *
 * @param {!plugin.cesium.Camera} camera The camera.
 * @param {Cesium.ScreenSpaceCameraController} sscc The camera controller.
 */
const configureCesium = function(camera, sscc) {
  // allow zooming out further in the 3D view
  var maxResolution = map.zoomToResolution(0, map.PROJECTION);
  sscc.maximumZoomDistance = camera.calcDistanceForResolution(maxResolution, 0);

  // shift + right drag to change the camera direction
  var lookEventTypes = /** @type {Cesium.CameraEventObject} */ ({
    eventType: Cesium.CameraEventType.RIGHT_DRAG,
    modifier: Cesium.KeyboardEventModifier.SHIFT
  });
  sscc.lookEventTypes = [lookEventTypes];
  sscc.enableLook = true;

  // middle/right mouse drag to tilt the globe
  sscc.tiltEventTypes = [Cesium.CameraEventType.MIDDLE_DRAG, Cesium.CameraEventType.RIGHT_DRAG];

  // left mouse drag to rotate the globe
  sscc.rotateEventTypes = [Cesium.CameraEventType.LEFT_DRAG];

  // mouse wheel without modifiers to zoom
  sscc.zoomEventTypes = [Cesium.CameraEventType.WHEEL, Cesium.CameraEventType.PINCH, {
    eventType: Cesium.CameraEventType.WHEEL,
    modifier: Cesium.KeyboardEventModifier.CTRL
  }];

  // this limits camera movement per animation frame to reduce the jumpy camera behavior in low-framerate situations.
  // Cesium's user interactions (especially mouse zoom) freak out when the frame rate drops, causing the map to jump
  // all over the place. Reducing this ratio mitigates that behavior, but also slows down the interaction rate across
  // the board.
  //
  // Cesium default value: 0.1
  //
  sscc.maximumMovementRatio = 0.02;

  // olcs turns these off, but let's make sure they're off ourselves too
  sscc.inertiaSpin = 0;
  sscc.inertiaTranslate = 0;
  sscc.inertiaZoom = 0;
};

/**
 * Load Cesium mixins for OpenSphere interactions.
 */
const loadInteractionMixins = function() {
  os.interaction.DragBox.prototype.cleanupWebGL = dragbox.cleanupWebGL;
  os.interaction.DragBox.prototype.updateWebGL = dragbox.updateWebGL;

  os.interaction.DragCircle.prototype.cleanupWebGL = dragcircle.cleanupWebGL;
  os.interaction.DragCircle.prototype.updateWebGL = dragcircle.updateWebGL;

  os.interaction.DrawPolygon.prototype.cleanupWebGL = drawpolygon.cleanupWebGL;
  os.interaction.DrawPolygon.prototype.updateWebGL = drawpolygon.updateWebGL;

  os.interaction.Measure.prototype.cleanupWebGL = measure.cleanupWebGL;
  os.interaction.Measure.prototype.updateWebGL = measure.updateWebGL;
};

exports = {
  configureCesium,
  loadInteractionMixins
};

goog.provide('plugin.cesium.interaction');

goog.require('os.map');
goog.require('plugin.cesium.interaction.dragbox');
goog.require('plugin.cesium.interaction.dragcircle');
goog.require('plugin.cesium.interaction.drawpolygon');
goog.require('plugin.cesium.interaction.measure');


/**
 * Configure Cesium interactions.
 * @param {!plugin.cesium.Camera} camera The camera.
 * @param {Cesium.ScreenSpaceCameraController} sscc The camera controller.
 */
plugin.cesium.interaction.configureCesium = function(camera, sscc) {
  // allow zooming out further in the 3D view
  var maxResolution = os.map.zoomToResolution(0, os.map.PROJECTION);
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
 * Initialize an interaction with Cesium, if it has additional support.
 * @param {ol.interaction.Interaction} interaction The interaction.
 */
plugin.cesium.interaction.initInteraction = function(interaction) {
  if (interaction instanceof os.interaction.Measure) {
    plugin.cesium.interaction.measure.initialize(interaction);
  } else if (interaction instanceof os.interaction.DrawPolygon) {
    plugin.cesium.interaction.drawpolygon.initialize(interaction);
  } else if (interaction instanceof os.interaction.DragBox) {
    plugin.cesium.interaction.dragbox.initialize(interaction);
  } else if (interaction instanceof os.interaction.DragCircle) {
    plugin.cesium.interaction.dragcircle.initialize(interaction);
  }
};

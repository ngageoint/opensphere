goog.provide('os.interaction');

goog.require('ol.layer.Vector');
goog.require('os.feature');
goog.require('os.map');


/**
 * Feature hit detection callback.
 * @param {(ol.Feature|ol.render.Feature)} feature The feature
 * @param {ol.layer.Layer} layer The layer containing the feature
 * @return {osx.interaction.FeatureResult|undefined} The hit detection result.
 */
os.interaction.getFeatureResult = function(feature, layer) {
  if (feature instanceof ol.Feature) {
    // do not hit detect "preview" features
    if (feature.get(os.data.RecordField.DRAWING_LAYER_NODE) === false) {
      return undefined;
    }

    if (!layer) {
      layer = os.feature.getLayer(feature);
    }

    // if the layer can't be determined, don't return anything
    if (layer) {
      return /** @type {!osx.interaction.FeatureResult} */ ({
        feature: feature,
        layer: layer
      });
    }
  }

  return undefined;
};


/**
 * Get the delta value to use when zooming.
 * @param {boolean} boost If the delta should be boosted
 * @param {boolean} inverse If the delta should be inverted
 * @return {number}
 */
os.interaction.getZoomDelta = function(boost, inverse) {
  var delta;

  var mapContainer = os.MapContainer.getInstance();
  if (mapContainer.is3DEnabled()) {
    delta = boost ? 0.5 : 0.9;

    if (inverse) {
      delta = 1 / delta;
    }
  } else {
    delta = boost ? 1 : 0.2;

    if (inverse) {
      delta = -delta;
    }
  }

  return delta;
};


/**
 * Configure Cesium interactions.
 * @param {Cesium.ScreenSpaceCameraController} sscc The camera controller
 */
os.interaction.configureCesium = function(sscc) {
  var map = os.MapContainer.getInstance();
  var camera = map.getCesiumCamera();
  if (camera) {
    // allow zooming out further in the 3D view
    var maxResolution = os.map.zoomToResolution(0, os.map.PROJECTION);
    sscc.maximumZoomDistance = camera.calcDistanceForResolution(maxResolution, 0);
  }

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
  sscc.zoomEventTypes = [Cesium.CameraEventType.WHEEL];

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
 * @param {ol.layer.Layer} layer Layer.
 * @return {boolean} Include.
 */
os.interaction.defaultLayerFilter = function(layer) {
  // unmanaged layers aren't automatically included in hit detection, so the ol.layer.Vector check is intended to
  // cover those layers
  return layer instanceof ol.layer.Vector;
};

goog.declareModuleId('plugin.cesium.interaction');

import DragBox from '../../../os/interaction/dragboxinteraction.js';
import DragCircle from '../../../os/interaction/dragcircleinteraction.js';
import DrawPolygon from '../../../os/interaction/drawpolygoninteraction.js';
import Measure from '../../../os/interaction/measureinteraction.js';
import {PROJECTION, zoomToResolution} from '../../../os/map/map.js';
import * as dragbox from './cesiumdragboxinteraction.js';
import * as dragcircle from './cesiumdragcircleinteraction.js';
import * as drawpolygon from './cesiumdrawpolygoninteraction.js';
import * as measure from './cesiummeasureinteraction.js';

const {default: Camera} = goog.requireType('plugin.cesium.Camera');


/**
 * Configure Cesium interactions.
 *
 * @param {!Camera} camera The camera.
 * @param {Cesium.ScreenSpaceCameraController} sscc The camera controller.
 */
export const configureCesium = function(camera, sscc) {
  // allow zooming out further in the 3D view
  var maxResolution = zoomToResolution(0, PROJECTION);
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
export const loadInteractionMixins = function() {
  DragBox.prototype.cleanupWebGL = dragbox.cleanupWebGL;
  DragBox.prototype.updateWebGL = dragbox.updateWebGL;

  DragCircle.prototype.cleanupWebGL = dragcircle.cleanupWebGL;
  DragCircle.prototype.updateWebGL = dragcircle.updateWebGL;

  DrawPolygon.prototype.cleanupWebGL = drawpolygon.cleanupWebGL;
  DrawPolygon.prototype.updateWebGL = drawpolygon.updateWebGL;

  /** @override */
  Measure.prototype.cleanupWebGL = measure.cleanupWebGL;
  /** @override */
  Measure.prototype.updateWebGL = measure.updateWebGL;
};

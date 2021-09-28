goog.declareModuleId('os.webgl.IWebGLCamera');

const {default: IPersistable} = goog.requireType('os.IPersistable');


/**
 * Interface for a WebGL camera synchronized to the OpenLayers view.
 *
 * @extends {IPersistable<osx.map.CameraState>}
 * @interface
 */
export default class IWebGLCamera {
  /**
   * Calculate the distance between the camera and center point based on the resolution and latitude value.
   * @param {number} resolution Number of map units per pixel.
   * @param {number} latitude Latitude in radians.
   * @return {number} The calculated distance.
   */
  calcDistanceForResolution(resolution, latitude) {}

  /**
   * Calculate the resolution based on a distance (camera to position) and latitude value.
   * @param {number} distance The distance in meters.
   * @param {number} latitude Latitude in radians.
   * @return {number} The calculated resolution.
   */
  calcResolutionForDistance(distance, latitude) {}

  /**
   * Flies the camera to point at the specified target.
   * @param {!osx.map.FlyToOptions} options The fly to options.
   */
  flyTo(options) {}

  /**
   * Cancels the current camera flight if one is in progress. The camera is left at it's current location.
   */
  cancelFlight() {}

  /**
   * Get the altitude of the camera in meters.
   * @return {number}
   */
  getAltitude() {}

  /**
   * Set the altitude of the camera in meters.
   * @param {number} altitude The new altitude in meters.
   */
  setAltitude(altitude) {}

  /**
   * Get the center of the camera view.
   * @return {ol.Coordinate|undefined} The center, in degrees.
   */
  getCenter() {}

  /**
   * Get the camera view extent.
   * @return {ol.Extent|undefined} The extent in degrees or undefined if the ellipsoid is not visible.
   */
  getExtent() {}

  /**
   * Get the heading of the camera in radians.
   * @return {number}
   */
  getHeading() {}

  /**
   * Set the heading of the camera in radians.
   * @param {number} heading The new heading in radians.
   */
  setHeading(heading) {}

  /**
   * Get the tilt of the camera in radians.
   * @return {number}
   */
  getTilt() {}

  /**
   * Set the tilt of the camera in radians.
   * @param {number} tilt The new tilt in radians.
   */
  setTilt(tilt) {}

  /**
   * Get the distance from the camera to the center of the screen.
   * @return {number} The distance in meters.
   */
  getDistanceToCenter() {}

  /**
   * Update the camera from the current OpenLayers view state.
   */
  readFromView() {}

  /**
   * Zooms the camera by the provided delta value.
   * @param {number} delta The zoom delta.
   */
  zoomByDelta(delta) {}

  /**
   * Rotates the camera around the center of the camera's reference frame by angle to the left.
   * @param {number=} opt_value The angle, in radians, to rotate by.
   */
  rotateLeft(opt_value) {}

  /**
   * Rotates the camera around the center of the camera's reference frame by angle to the right.
   * @param {number=} opt_value The angle, in radians, to rotate by.
   */
  rotateRight(opt_value) {}

  /**
   * Rotates the camera around the center of the camera's reference frame by angle upwards.
   * @param {number=} opt_value The angle, in radians, to rotate by.
   */
  rotateUp(opt_value) {}

  /**
   * Rotates the camera around the center of the camera's reference frame by angle downwards.
   * @param {number=} opt_value The angle, in radians, to rotate by.
   */
  rotateDown(opt_value) {}

  /**
   * Rotate the camera counter-clockwise around its direction vector by amount, in radians.
   * @param {number=} opt_value The angle, in radians.
   */
  twistLeft(opt_value) {}

  /**
   * Rotate the camera clockwise around its direction vector by amount, in radians.
   * @param {number=} opt_value The angle, in radians.
   */
  twistRight(opt_value) {}
}

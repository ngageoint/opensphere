goog.provide('os.webgl.IWebGLCamera');

goog.require('os.IPersistable');


/**
 * Interface for a WebGL camera synchronized to the OpenLayers view.
 * @extends {os.IPersistable<osx.map.CameraState>}
 * @interface
 */
os.webgl.IWebGLCamera = function() {};


/**
 * Calculate the distance between the camera and center point based on the resolution and latitude value.
 * @param {number} resolution Number of map units per pixel.
 * @param {number} latitude Latitude in radians.
 * @return {number} The calculated distance.
 */
os.webgl.IWebGLCamera.prototype.calcDistanceForResolution;


/**
 * Calculate the resolution based on a distance (camera to position) and latitude value.
 * @param {number} distance The distance in meters.
 * @param {number} latitude Latitude in radians.
 * @return {number} The calculated resolution.
 */
os.webgl.IWebGLCamera.prototype.calcResolutionForDistance;


/**
 * Flies the camera to point at the specified target.
 * @param {!osx.map.FlyToOptions} options The fly to options.
 */
os.webgl.IWebGLCamera.prototype.flyTo;


/**
 * Cancels the current camera flight if one is in progress. The camera is left at it's current location.
 */
os.webgl.IWebGLCamera.prototype.cancelFlight;


/**
 * Get the altitude of the camera in meters.
 * @return {number}
 */
os.webgl.IWebGLCamera.prototype.getAltitude;


/**
 * Set the altitude of the camera in meters.
 * @param {number} altitude The new altitude in meters.
 */
os.webgl.IWebGLCamera.prototype.setAltitude;


/**
 * Get the camera view extent.
 * @return {ol.Extent|undefined} The extent in degrees or undefined if the ellipsoid is not visible.
 */
os.webgl.IWebGLCamera.prototype.getExtent;


/**
 * Get the heading of the camera in radians.
 * @return {number}
 */
os.webgl.IWebGLCamera.prototype.getHeading;


/**
 * Set the heading of the camera in radians.
 * @param {number} heading The new heading in radians.
 */
os.webgl.IWebGLCamera.prototype.setHeading;


/**
 * Get the tilt of the camera in radians.
 * @return {number}
 */
os.webgl.IWebGLCamera.prototype.getTilt;


/**
 * Set the tilt of the camera in radians.
 * @param {number} tilt The new tilt in radians.
 */
os.webgl.IWebGLCamera.prototype.setTilt;


/**
 * Get the distance from the camera to the center of the screen.
 * @return {number} The distance in meters.
 */
os.webgl.IWebGLCamera.prototype.getDistanceToCenter;


/**
 * Update the camera from the current OpenLayers view state.
 */
os.webgl.IWebGLCamera.prototype.readFromView;


/**
 * Zooms the camera by the provided delta value.
 * @param {number} delta The zoom delta.
 */
os.webgl.IWebGLCamera.prototype.zoomByDelta;


/**
 * Persist the camera state.
 * @override
 */
os.webgl.IWebGLCamera.prototype.persist;


/**
 * Restore the camera state.
 * @override
 */
os.webgl.IWebGLCamera.prototype.restore;

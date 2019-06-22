goog.provide('os.webgl.IWebGLRenderer');

goog.require('goog.disposable.IDisposable');
goog.require('os.webgl.IWebGLCamera');


/**
 * Interface for a WebGL map/globe renderer.
 * @extends {goog.disposable.IDisposable}
 * @interface
 */
os.webgl.IWebGLRenderer = function() {};


/**
 * If the renderer is initialized.
 * @return {boolean}
 */
os.webgl.IWebGLRenderer.prototype.isInitialized;


/**
 * Initialize the renderer.
 * @return {!goog.Thenable}
 */
os.webgl.IWebGLRenderer.prototype.initialize;


/**
 * Synchronously render a frame in the WebGL context.
 */
os.webgl.IWebGLRenderer.prototype.renderSync;


/**
 * Reset the WebGL synchronizer.
 */
os.webgl.IWebGLRenderer.prototype.resetSync;


/**
 * If the renderer is enabled.
 * @return {boolean}
 */
os.webgl.IWebGLRenderer.prototype.getEnabled;


/**
 * Set if the renderer is enabled.
 * @param {boolean} value If the renderer should be enabled.
 */
os.webgl.IWebGLRenderer.prototype.setEnabled;


/**
 * Get the WebGL camera.
 * @return {os.webgl.IWebGLCamera|undefined}
 */
os.webgl.IWebGLRenderer.prototype.getCamera;


/**
 * Get the Openlayers map.
 * @return {ol.PluggableMap|undefined}
 */
os.webgl.IWebGLRenderer.prototype.getMap;


/**
 * Set the Openlayers map.
 * @param {ol.PluggableMap|undefined} value The Openlayers map.
 */
os.webgl.IWebGLRenderer.prototype.setMap;


/**
 * Get the coordinate for a given pixel.
 * @param {ol.Pixel} pixel The pixel.
 * @return {ol.Coordinate} The coordinate, or null if no coordinate at the given pixel.
 */
os.webgl.IWebGLRenderer.prototype.getCoordinateFromPixel;


/**
 * Get the pixel for a given coordinate.
 * @param {ol.Coordinate} coordinate The coordinate.
 * @param {boolean=} opt_inView If the coordinate must be in the camera view and not occluded by the globe.
 * @return {ol.Pixel} The pixel, or null if no pixel at the given coordinate.
 */
os.webgl.IWebGLRenderer.prototype.getPixelFromCoordinate;


/**
 * Detect features that intersect a pixel on the viewport, and execute a callback with each intersecting feature.
 * Layers included in the detection can be configured through the `layerFilter` option in `opt_options`.
 *
 * @param {ol.Pixel} pixel Pixel.
 * @param {function(this: S, (ol.Feature|ol.render.Feature),
 *     ol.layer.Layer): T} callback Feature callback. The callback will be
 *     called with two arguments. The first argument is one
 *     {@link ol.Feature feature} or
 *     {@link ol.render.Feature render feature} at the pixel, the second is
 *     the {@link ol.layer.Layer layer} of the feature and will be null for
 *     unmanaged layers. To stop detection, callback functions can return a
 *     truthy value.
 * @param {olx.AtPixelOptions=} opt_options Optional options.
 * @return {T|undefined} Callback result, i.e. the return value of last
 * callback execution, or the first truthy callback return value.
 *
 * @template S,T
 */
os.webgl.IWebGLRenderer.prototype.forEachFeatureAtPixel;


/**
 * Toggles user movement of the globe.
 * @param {boolean} value If user movement should be enabled.
 */
os.webgl.IWebGLRenderer.prototype.toggleMovement;


/**
 * Get the altitude modes the WebGL renderer supports.
 * @return {Array<os.webgl.AltitudeMode>} The supported modes
 */
os.webgl.IWebGLRenderer.prototype.getAltitudeModes;


/**
 * Register a callback to fire after each frame is rendered.
 * @param {function()} callback The callback.
 * @return {function()|undefined} A deregistration function, or undefined if unsupported by the renderer.
 */
os.webgl.IWebGLRenderer.prototype.onPostRender;


/**
 * Adds a command to fly to the features
 * @param {Array<ol.Feature>} features
 */
os.webgl.IWebGLRenderer.prototype.flyToFeatures;

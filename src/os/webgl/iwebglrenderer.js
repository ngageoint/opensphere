goog.provide('os.webgl.IWebGLRenderer');

goog.require('goog.disposable.IDisposable');


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

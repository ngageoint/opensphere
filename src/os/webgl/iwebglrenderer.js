goog.declareModuleId('os.webgl.IWebGLRenderer');

const IDisposable = goog.requireType('goog.disposable.IDisposable');
const {default: IWebGLCamera} = goog.requireType('os.webgl.IWebGLCamera');


/**
 * Interface for a WebGL map/globe renderer.
 *
 * @extends {IDisposable}
 * @interface
 */
export default class IWebGLRenderer {
  /**
   * The text id for the renderer
   * @return {string}
   */
  getId() {}

  /**
   * A user facing label for the renderer
   * @return {string}
   */
  getLabel() {}

  /**
   * A user facing description for the renderer
   * @return {string}
   */
  getDescription() {}

  /**
   * If the renderer is initialized.
   * @return {boolean}
   */
  isInitialized() {}

  /**
   * Initialize the renderer.
   * @return {!goog.Thenable}
   */
  initialize() {}

  /**
   * Synchronously render a frame in the WebGL context.
   */
  renderSync() {}

  /**
   * Reset the WebGL synchronizer.
   */
  resetSync() {}

  /**
   * If the renderer is enabled.
   * @return {boolean}
   */
  getEnabled() {}

  /**
   * Set if the renderer is enabled.
   * @param {boolean} value If the renderer should be enabled.
   */
  setEnabled(value) {}

  /**
   * Get the WebGL camera.
   * @return {IWebGLCamera|undefined}
   */
  getCamera() {}

  /**
   * Get the Openlayers map.
   * @return {ol.PluggableMap|undefined}
   */
  getMap() {}

  /**
   * Set the Openlayers map.
   * @param {ol.PluggableMap|undefined} value The Openlayers map.
   */
  setMap(value) {}

  /**
   * Get the coordinate for a given pixel.
   * @param {ol.Pixel} pixel The pixel.
   * @return {ol.Coordinate} The coordinate, or null if no coordinate at the given pixel.
   */
  getCoordinateFromPixel(pixel) {}

  /**
   * Get the pixel for a given coordinate.
   * @param {ol.Coordinate} coordinate The coordinate.
   * @param {boolean=} opt_inView If the coordinate must be in the camera view and not occluded by the globe.
   * @return {ol.Pixel} The pixel, or null if no pixel at the given coordinate.
   */
  getPixelFromCoordinate(coordinate, opt_inView) {}

  /**
   * Detect features that intersect a pixel on the viewport, and execute a callback with each intersecting feature.
   * Layers included in the detection can be configured through the `layerFilter` option in `opt_options`.
   *
   * @param {ol.Pixel} pixel Pixel.
   * @param {function(this: S, (ol.Feature|ol.render.Feature), ol.layer.Layer): T} callback Feature callback.
   *     The callback will be called with two arguments. The first argument is one {@link ol.Feature feature} or
   *     {@link ol.render.Feature render feature} at the pixel, the second is
   *     the {@link ol.layer.Layer layer} of the feature and will be null for
   *     unmanaged layers. To stop detection, callback functions can return a truthy value.
   * @param {olx.AtPixelOptions=} opt_options Optional options.
   * @return {T|undefined} Callback result, i.e. the return value of last
   * callback execution, or the first truthy callback return value.
   *
   * @template S,T
   */
  forEachFeatureAtPixel(pixel, callback, opt_options) {}

  /**
   * Indicates if this renderer can show video within tile overlays.
   * @return {boolean} True if the renderer can show video in tile overlays, false if it cannot.
   */
  supportsVideoOverlay() {}

  /**
   * Toggles user movement of the globe.
   * @param {boolean} value If user movement should be enabled.
   */
  toggleMovement(value) {}

  /**
   * Get the altitude modes the WebGL renderer supports.
   * @return {Array<os.webgl.AltitudeMode>} The supported modes
   */
  getAltitudeModes() {}

  /**
   * Register a callback to fire after each frame is rendered.
   * @param {function()} callback The callback.
   * @return {function()|undefined} A deregistration function, or undefined if unsupported by the renderer.
   */
  onPostRender(callback) {}

  /**
   * Adds a command to fly to the features
   * @param {Array<ol.Feature>} features
   */
  flyToFeatures(features) {}

  /**
   * Get the max feature count for this renderer.
   * @return {number}
   */
  getMaxFeatureCount() {}

  /**
   * Set the max feature count for this renderer.
   * @param {Array<ol.Feature>} features
   */
  setMaxFeatureCount(features) {}

  /**
   * Get the active terrain provider.
   * @return {osx.map.TerrainProviderOptions|undefined}
   */
  getActiveTerrainProvider() {}

  /**
   * Set the active terrain provider.
   * @param {osx.map.TerrainProviderOptions|string} provider The new provider.
   */
  setActiveTerrainProvider(provider) {}

  /**
   * Get the terrain providers supported by this renderer.
   * @return {!Array<!osx.map.TerrainProviderOptions>}
   */
  getSupportedTerrainProviders() {}
}

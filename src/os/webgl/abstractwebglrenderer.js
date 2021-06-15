goog.module('os.webgl.AbstractWebGLRenderer');
goog.module.declareLegacyNamespace();

const Disposable = goog.require('goog.Disposable');
const Promise = goog.require('goog.Promise');
const dispatcher = goog.require('os.Dispatcher');
const MapEvent = goog.require('os.MapEvent');
const DisplaySetting = goog.require('os.config.DisplaySetting');
const Settings = goog.require('os.config.Settings');
const fn = goog.require('os.fn');
const terrain = goog.require('os.map.terrain');
const IWebGLRenderer = goog.requireType('os.webgl.IWebGLRenderer');


goog.requireType('os.webgl.AbstractRootSynchronizer');


/**
 * Abstract WebGL renderer implementation.
 *
 * @abstract
 * @implements {IWebGLRenderer}
 */
class AbstractWebGLRenderer extends Disposable {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The renderer id
     * @type {string}
     * @protected
     */
    this.id = '';

    /**
     * The renderer label
     * @type {string}
     * @protected
     */
    this.label = '';

    /**
     * The renderer description
     * @type {string}
     * @protected
     */
    this.description = '';

    /**
     * If the renderer has been initialized.
     * @type {boolean}
     * @protected
     */
    this.initialized = false;

    /**
     * If the renderer is enabled.
     * @type {boolean}
     * @protected
     */
    this.enabled = false;

    /**
     * The Openlayers map.
     * @type {ol.PluggableMap|undefined}
     * @protected
     */
    this.map = undefined;

    /**
     * The logger for the renderer.
     * @type {goog.log.Logger}
     * @protected
     */
    this.log = AbstractWebGLRenderer.LOGGER_;

    /**
     * The root WebGL Synchronizer.
     * @type {os.webgl.AbstractRootSynchronizer|undefined}
     * @protected
     */
    this.rootSynchronizer = undefined;

    /**
     * Target rendering frame rate.
     * @type {number}
     * @protected
     */
    this.targetFrameRate = 60;

    /**
     * Settings keys monitored by the map container.
     * @type {!Array<string>}
     * @protected
     */
    this.watchedSettings = [
      DisplaySetting.BG_COLOR,
      DisplaySetting.ENABLE_LIGHTING,
      DisplaySetting.ENABLE_SKY,
      DisplaySetting.ENABLE_TERRAIN,
      DisplaySetting.FOG_ENABLED,
      DisplaySetting.FOG_DENSITY,
      terrain.TerrainSetting.ACTIVE_TERRAIN
    ];

    /**
     * Settings key to get the max features value for this renderer.
     * @type {string}
     * @protected
     */
    this.maxFeaturesKey = 'maxFeatures.3d';

    /**
     * Terrain types supported by this renderer.
     * @type {!Array<string>}
     * @protected
     */
    this.supportedTerrainTypes = [];

    /**
     * The active terrain provider options.
     * @type {osx.map.TerrainProviderOptions|undefined}
     * @protected
     */
    this.activeTerrain = undefined;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    // clean up settings key listeners
    this.watchedSettings.forEach(function(key) {
      Settings.getInstance().unlisten(key, this.onSettingChange, false, this);
    }, this);
  }

  /**
   * @inheritDoc
   */
  getId() {
    return this.id || '';
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    return this.label || '';
  }

  /**
   * @inheritDoc
   */
  getDescription() {
    return this.description || '';
  }

  /**
   * @inheritDoc
   */
  getMap() {
    return this.map;
  }

  /**
   * @inheritDoc
   */
  setMap(value) {
    this.map = value;
  }

  /**
   * @inheritDoc
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * @inheritDoc
   */
  initialize() {
    if (!this.initialized) {
      // add settings key listeners
      this.watchedSettings.forEach(function(key) {
        Settings.getInstance().listen(key, this.onSettingChange, false, this);
      }, this);

      // initialize the active terrain provider
      this.getActiveTerrainProvider();

      this.initialized = true;
    }

    return Promise.resolve();
  }

  /**
   * @inheritDoc
   */
  resetSync() {
    if (this.rootSynchronizer) {
      // reset all synchronizers to a clean state. this needs to be called after WebGL is enabled/rendering to ensure
      // synchronized objects are reset in the correct state.
      this.rootSynchronizer.reset();
    }
  }

  /**
   * @inheritDoc
   */
  supportsVideoOverlay() {
    return false;
  }

  /**
   * @abstract
   * @inheritDoc
   */
  getCoordinateFromPixel(pixel) {}

  /**
   * @abstract
   * @inheritDoc
   */
  getPixelFromCoordinate(coord) {}

  /**
   * @abstract
   * @inheritDoc
   */
  forEachFeatureAtPixel(pixel, callback) {}

  /**
   * @abstract
   * @inheritDoc
   */
  toggleMovement(value) {}

  /**
   * @inheritDoc
   */
  getEnabled() {
    return this.enabled;
  }

  /**
   * @inheritDoc
   */
  setEnabled(value) {
    if (this.rootSynchronizer) {
      this.rootSynchronizer.setActive(value);
    }

    this.enabled = value;
  }

  /**
   * @abstract
   * @inheritDoc
   */
  getCamera() {}

  /**
   * Handle settings changes that affect the renderer.
   *
   * @param {!os.events.SettingChangeEvent} event The event.
   * @protected
   */
  onSettingChange(event) {
    switch (event.type) {
      case DisplaySetting.BG_COLOR:
        var color = /** @type {string} */ (event.newVal);
        if (os.color.isColorString(color)) {
          this.setBGColor(color);
        }
        break;
      case DisplaySetting.ENABLE_SKY:
        this.showSky(!!event.newVal);
        break;
      case DisplaySetting.ENABLE_LIGHTING:
        this.showSunlight(!!event.newVal);
        break;
      case DisplaySetting.ENABLE_TERRAIN:
        this.showTerrain(!!event.newVal);
        break;
      case DisplaySetting.FOG_ENABLED:
        this.showFog(!!event.newVal);
        break;
      case DisplaySetting.FOG_DENSITY:
        if (typeof event.newVal === 'number') {
          this.setFogDensity(event.newVal);
        }
        break;
      case terrain.TerrainSetting.ACTIVE_TERRAIN:
        if (this.getEnabled()) {
          this.updateTerrainProvider();
        }
        break;
      default:
        break;
    }
  }

  /**
   * Set the background color.
   *
   * @param {string} value The new color.
   */
  setBGColor(value) {
    // implement to support changing the map/globe background color
  }

  /**
   * Toggle if fog is displayed.
   *
   * @param {boolean} value If fog should be displayed.
   * @protected
   */
  showFog(value) {
    // implement to support fog
  }

  /**
   * Set the fog density.
   *
   * @param {number} value The fog density as a percentage, from 0 to 1.
   * @protected
   */
  setFogDensity(value) {
    // implement to support fog density
  }

  /**
   * Toggle if the sky is displayed.
   *
   * @param {boolean} value If the sky should be displayed.
   * @protected
   */
  showSky(value) {
    // implement to support sky
  }

  /**
   * Toggle if sunlight is displayed.
   *
   * @param {boolean} value If sunlight should be displayed.
   * @protected
   */
  showSunlight(value) {
    // implement to support sunlight
  }

  /**
   * Get the active terrain provider.
   * @return {osx.map.TerrainProviderOptions|undefined}
   */
  getActiveTerrainProvider() {
    if (!this.activeTerrain) {
      const supported = this.getSupportedTerrainProviders();
      if (supported.length) {
        // use the previously active terrain if supported, otherwise use the last terrain provider loaded from settings
        const activeId = Settings.getInstance().get(terrain.TerrainSetting.ACTIVE_TERRAIN);
        const found = activeId ? supported.find((p) => p.id === activeId) : undefined;

        this.activeTerrain = found || supported[supported.length - 1];

        // save the active provider to settings if it changed
        if (activeId !== this.activeTerrain.id) {
          Settings.getInstance().set(terrain.TerrainSetting.ACTIVE_TERRAIN, this.activeTerrain.id);
        }
      }
    }

    return this.activeTerrain;
  }

  /**
   * Set the active terrain provider.
   * @param {osx.map.TerrainProviderOptions|string} provider The new provider.
   */
  setActiveTerrainProvider(provider) {
    const providers = this.getSupportedTerrainProviders();
    let newProvider;

    if (typeof provider === 'string') {
      newProvider = providers.find((p) => p.id === provider);
    } else {
      newProvider = provider;
    }

    if (newProvider && newProvider !== this.activeTerrain) {
      this.activeTerrain = newProvider;
      Settings.getInstance().set(terrain.TerrainSetting.ACTIVE_TERRAIN, this.activeTerrain.id);
    }
  }

  /**
   * Get the terrain providers supported by this renderer.
   * @return {!Array<!osx.map.TerrainProviderOptions>}
   */
  getSupportedTerrainProviders() {
    return terrain.getTerrainProviders()
        .filter((p) => this.supportedTerrainTypes.indexOf(p.type) > -1);
  }

  /**
   * Disable the terrain provider.
   *
   * @protected
   */
  disableTerrain() {
    // disable the terrain provider and switch to the default
    Settings.getInstance().set(DisplaySetting.ENABLE_TERRAIN, false);

    // notify that terrain has been disabled
    dispatcher.getInstance().dispatchEvent(MapEvent.TERRAIN_DISABLED);
  }

  /**
   * Toggle if terrain is displayed.
   *
   * @param {boolean} value If terrain should be displayed.
   * @protected
   */
  showTerrain(value) {
    // implement to support terrain
  }

  /**
   * Update the terrain provider.
   *
   * @protected
   */
  updateTerrainProvider() {
    // implement to support terrain
  }

  /**
   * @inheritDoc
   */
  getAltitudeModes() {
    return [
      os.webgl.AltitudeMode.ABSOLUTE
    ];
  }

  /**
   * @inheritDoc
   */
  onPostRender(callback) {
    return undefined;
  }

  /**
   * @inheritDoc
   * @abstract
   */
  flyToFeatures(features) {}

  /**
   * @inheritDoc
   */
  getMaxFeatureCount() {
    return (
      /** @type {number} */ Settings.getInstance().get(this.maxFeaturesKey, 150000)
    );
  }

  /**
   * @inheritDoc
   */
  setMaxFeatureCount(value) {
    Settings.getInstance().set(this.maxFeaturesKey, value);
  }
}


/**
 * The default logger. Override `this.log` in sub-classes.
 * @type {goog.log.Logger}
 * @private
 * @const
 */
AbstractWebGLRenderer.LOGGER_ = goog.log.getLogger('os.webgl.AbstractWebGLRenderer');


/**
 * The settings key for tracking the active renderer
 * @type {string}
 * @const
 */
AbstractWebGLRenderer.ACTIVE_SETTINGS_KEY = 'activeWebGLRenderer';


/**
 * @inheritDoc
 */
AbstractWebGLRenderer.prototype.renderSync = fn.noop;


exports = AbstractWebGLRenderer;

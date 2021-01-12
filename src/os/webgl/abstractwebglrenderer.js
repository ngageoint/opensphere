goog.provide('os.webgl.AbstractWebGLRenderer');

goog.require('goog.Disposable');
goog.require('goog.Promise');
goog.require('os.MapEvent');
goog.require('os.config.DisplaySetting');
goog.require('os.map.terrain');
goog.require('os.webgl.IWebGLRenderer');


/**
 * Abstract WebGL renderer implementation.
 *
 * @abstract
 * @implements {os.webgl.IWebGLRenderer}
 * @extends {goog.Disposable}
 * @constructor
 */
os.webgl.AbstractWebGLRenderer = function() {
  os.webgl.AbstractWebGLRenderer.base(this, 'constructor');

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
  this.log = os.webgl.AbstractWebGLRenderer.LOGGER_;

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
    os.config.DisplaySetting.BG_COLOR,
    os.config.DisplaySetting.ENABLE_LIGHTING,
    os.config.DisplaySetting.ENABLE_SKY,
    os.config.DisplaySetting.ENABLE_TERRAIN,
    os.config.DisplaySetting.FOG_ENABLED,
    os.config.DisplaySetting.FOG_DENSITY,
    os.map.terrain.TerrainSetting.ACTIVE_TERRAIN
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
};
goog.inherits(os.webgl.AbstractWebGLRenderer, goog.Disposable);


/**
 * The default logger. Override `this.log` in sub-classes.
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.webgl.AbstractWebGLRenderer.LOGGER_ = goog.log.getLogger('os.webgl.AbstractWebGLRenderer');


/**
 * The settings key for tracking the active renderer
 * @type {string}
 * @const
 */
os.webgl.AbstractWebGLRenderer.ACTIVE_SETTINGS_KEY = 'activeWebGLRenderer';


/**
 * @inheritDoc
 */
os.webgl.AbstractWebGLRenderer.prototype.disposeInternal = function() {
  os.webgl.AbstractWebGLRenderer.base(this, 'disposeInternal');

  // clean up settings key listeners
  this.watchedSettings.forEach(function(key) {
    os.settings.unlisten(key, this.onSettingChange, false, this);
  }, this);
};


/**
 * @inheritDoc
 */
os.webgl.AbstractWebGLRenderer.prototype.getId = function() {
  return this.id || '';
};


/**
 * @inheritDoc
 */
os.webgl.AbstractWebGLRenderer.prototype.getLabel = function() {
  return this.label || '';
};


/**
 * @inheritDoc
 */
os.webgl.AbstractWebGLRenderer.prototype.getDescription = function() {
  return this.description || '';
};


/**
 * @inheritDoc
 */
os.webgl.AbstractWebGLRenderer.prototype.getMap = function() {
  return this.map;
};


/**
 * @inheritDoc
 */
os.webgl.AbstractWebGLRenderer.prototype.setMap = function(value) {
  this.map = value;
};


/**
 * @inheritDoc
 */
os.webgl.AbstractWebGLRenderer.prototype.isInitialized = function() {
  return this.initialized;
};


/**
 * @inheritDoc
 */
os.webgl.AbstractWebGLRenderer.prototype.initialize = function() {
  if (!this.initialized) {
    // add settings key listeners
    this.watchedSettings.forEach(function(key) {
      os.settings.listen(key, this.onSettingChange, false, this);
    }, this);

    // initialize the active terrain provider
    this.getActiveTerrainProvider();

    this.initialized = true;
  }

  return goog.Promise.resolve();
};


/**
 * @inheritDoc
 */
os.webgl.AbstractWebGLRenderer.prototype.renderSync = goog.nullFunction;


/**
 * @inheritDoc
 */
os.webgl.AbstractWebGLRenderer.prototype.resetSync = function() {
  if (this.rootSynchronizer) {
    // reset all synchronizers to a clean state. this needs to be called after WebGL is enabled/rendering to ensure
    // synchronized objects are reset in the correct state.
    this.rootSynchronizer.reset();
  }
};

/**
 * @inheritDoc
 */
os.webgl.AbstractWebGLRenderer.prototype.supportsVideoOverlay = function() {
  return false;
};

/**
 * @abstract
 * @inheritDoc
 */
os.webgl.AbstractWebGLRenderer.prototype.getCoordinateFromPixel = function(pixel) {};


/**
 * @abstract
 * @inheritDoc
 */
os.webgl.AbstractWebGLRenderer.prototype.getPixelFromCoordinate = function(coord) {};


/**
 * @abstract
 * @inheritDoc
 */
os.webgl.AbstractWebGLRenderer.prototype.forEachFeatureAtPixel = function(pixel, callback) {};


/**
 * @abstract
 * @inheritDoc
 */
os.webgl.AbstractWebGLRenderer.prototype.toggleMovement = function(value) {};


/**
 * @inheritDoc
 */
os.webgl.AbstractWebGLRenderer.prototype.getEnabled = function() {
  return this.enabled;
};


/**
 * @inheritDoc
 */
os.webgl.AbstractWebGLRenderer.prototype.setEnabled = function(value) {
  if (this.rootSynchronizer) {
    this.rootSynchronizer.setActive(value);
  }

  this.enabled = value;
};


/**
 * @abstract
 * @inheritDoc
 */
os.webgl.AbstractWebGLRenderer.prototype.getCamera = function() {};


/**
 * Handle settings changes that affect the renderer.
 *
 * @param {!os.events.SettingChangeEvent} event The event.
 * @protected
 */
os.webgl.AbstractWebGLRenderer.prototype.onSettingChange = function(event) {
  switch (event.type) {
    case os.config.DisplaySetting.BG_COLOR:
      var color = /** @type {string} */ (event.newVal);
      if (os.color.isColorString(color)) {
        this.setBGColor(color);
      }
      break;
    case os.config.DisplaySetting.ENABLE_SKY:
      this.showSky(!!event.newVal);
      break;
    case os.config.DisplaySetting.ENABLE_LIGHTING:
      this.showSunlight(!!event.newVal);
      break;
    case os.config.DisplaySetting.ENABLE_TERRAIN:
      this.showTerrain(!!event.newVal);
      break;
    case os.config.DisplaySetting.FOG_ENABLED:
      this.showFog(!!event.newVal);
      break;
    case os.config.DisplaySetting.FOG_DENSITY:
      if (typeof event.newVal === 'number') {
        this.setFogDensity(event.newVal);
      }
      break;
    case os.map.terrain.TerrainSetting.ACTIVE_TERRAIN:
      if (this.getEnabled()) {
        this.updateTerrainProvider();
      }
      break;
    default:
      break;
  }
};


/**
 * Set the background color.
 *
 * @param {string} value The new color.
 */
os.webgl.AbstractWebGLRenderer.prototype.setBGColor = function(value) {
  // implement to support changing the map/globe background color
};


/**
 * Toggle if fog is displayed.
 *
 * @param {boolean} value If fog should be displayed.
 * @protected
 */
os.webgl.AbstractWebGLRenderer.prototype.showFog = function(value) {
  // implement to support fog
};


/**
 * Set the fog density.
 *
 * @param {number} value The fog density as a percentage, from 0 to 1.
 * @protected
 */
os.webgl.AbstractWebGLRenderer.prototype.setFogDensity = function(value) {
  // implement to support fog density
};


/**
 * Toggle if the sky is displayed.
 *
 * @param {boolean} value If the sky should be displayed.
 * @protected
 */
os.webgl.AbstractWebGLRenderer.prototype.showSky = function(value) {
  // implement to support sky
};


/**
 * Toggle if sunlight is displayed.
 *
 * @param {boolean} value If sunlight should be displayed.
 * @protected
 */
os.webgl.AbstractWebGLRenderer.prototype.showSunlight = function(value) {
  // implement to support sunlight
};


/**
 * Get the active terrain provider.
 * @return {osx.map.TerrainProviderOptions|undefined}
 */
os.webgl.AbstractWebGLRenderer.prototype.getActiveTerrainProvider = function() {
  if (!this.activeTerrain) {
    const supported = this.getSupportedTerrainProviders();
    if (supported.length) {
      // use the previously active terrain if supported, otherwise use the last terrain provider loaded from settings
      const activeId = os.settings.get(os.map.terrain.TerrainSetting.ACTIVE_TERRAIN);
      const found = activeId ? supported.find((p) => p.id === activeId) : undefined;

      this.activeTerrain = found || supported[supported.length - 1];

      // save the active provider to settings if it changed
      if (activeId !== this.activeTerrain.id) {
        os.settings.set(os.map.terrain.TerrainSetting.ACTIVE_TERRAIN, this.activeTerrain.id);
      }
    }
  }

  return this.activeTerrain;
};


/**
 * Set the active terrain provider.
 * @param {osx.map.TerrainProviderOptions|string} provider The new provider.
 */
os.webgl.AbstractWebGLRenderer.prototype.setActiveTerrainProvider = function(provider) {
  const providers = this.getSupportedTerrainProviders();
  let newProvider;

  if (typeof provider === 'string') {
    newProvider = providers.find((p) => p.id === provider);
  } else {
    newProvider = provider;
  }

  if (newProvider && newProvider !== this.activeTerrain) {
    this.activeTerrain = newProvider;
    os.settings.set(os.map.terrain.TerrainSetting.ACTIVE_TERRAIN, this.activeTerrain.id);
  }
};


/**
 * Get the terrain providers supported by this renderer.
 * @return {!Array<!osx.map.TerrainProviderOptions>}
 */
os.webgl.AbstractWebGLRenderer.prototype.getSupportedTerrainProviders = function() {
  return os.map.terrain.getTerrainProviders()
      .filter((p) => this.supportedTerrainTypes.indexOf(p.type) > -1);
};


/**
 * Disable the terrain provider.
 *
 * @protected
 */
os.webgl.AbstractWebGLRenderer.prototype.disableTerrain = function() {
  // disable the terrain provider and switch to the default
  os.settings.set(os.config.DisplaySetting.ENABLE_TERRAIN, false);

  // notify that terrain has been disabled
  os.dispatcher.dispatchEvent(os.MapEvent.TERRAIN_DISABLED);
};


/**
 * Toggle if terrain is displayed.
 *
 * @param {boolean} value If terrain should be displayed.
 * @protected
 */
os.webgl.AbstractWebGLRenderer.prototype.showTerrain = function(value) {
  // implement to support terrain
};


/**
 * Update the terrain provider.
 *
 * @protected
 */
os.webgl.AbstractWebGLRenderer.prototype.updateTerrainProvider = function() {
  // implement to support terrain
};

/**
 * @inheritDoc
 */
os.webgl.AbstractWebGLRenderer.prototype.getAltitudeModes = function() {
  return [
    os.webgl.AltitudeMode.ABSOLUTE
  ];
};


/**
 * @inheritDoc
 */
os.webgl.AbstractWebGLRenderer.prototype.onPostRender = function(callback) {
  return undefined;
};


/**
 * @inheritDoc
 * @abstract
 */
os.webgl.AbstractWebGLRenderer.prototype.flyToFeatures = function(features) {};


/**
 * @inheritDoc
 */
os.webgl.AbstractWebGLRenderer.prototype.getMaxFeatureCount = function() {
  return /** @type {number} */ (os.settings.get(this.maxFeaturesKey, 150000));
};


/**
 * @inheritDoc
 */
os.webgl.AbstractWebGLRenderer.prototype.setMaxFeatureCount = function(value) {
  os.settings.set(this.maxFeaturesKey, value);
};

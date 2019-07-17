goog.provide('os.webgl.AbstractWebGLRenderer');

goog.require('goog.Disposable');
goog.require('goog.Promise');
goog.require('os.MapEvent');
goog.require('os.config.DisplaySetting');
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
    os.config.DisplaySetting.TERRAIN_OPTIONS
  ];
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
    case os.config.DisplaySetting.TERRAIN_OPTIONS:
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

goog.declareModuleId('os.webgl.AbstractWebGLRenderer');

import * as osColor from '../color.js';
import DisplaySetting from '../config/displaysetting.js';
import Settings from '../config/settings.js';
import * as dispatcher from '../dispatcher.js';
import MapEvent from '../map/mapevent.js';
import * as terrain from '../map/terrain.js';
import AltitudeMode from './altitudemode.js';

// The compiler has to process this first or @inheritDoc will not work properly on implementing classes.
// @see https://github.com/google/closure-compiler/issues/3583
import IWebGLRenderer from './iwebglrenderer.js';// eslint-disable-line opensphere/no-unused-vars

const Disposable = goog.require('goog.Disposable');
const Promise = goog.require('goog.Promise');
const log = goog.require('goog.log');
const {default: SettingChangeEvent} = goog.requireType('os.events.SettingChangeEvent');

const {default: AbstractRootSynchronizer} = goog.requireType('os.webgl.AbstractRootSynchronizer');
const {default: IWebGLCamera} = goog.requireType('os.webgl.IWebGLCamera');


/**
 * Abstract WebGL renderer implementation.
 *
 * @abstract
 * @implements {IWebGLRenderer}
 */
export default class AbstractWebGLRenderer extends Disposable {
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
     * @type {AbstractRootSynchronizer|undefined}
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
  getPixelFromCoordinate(coord, opt_inView) {}

  /**
   * @abstract
   * @inheritDoc
   */
  forEachFeatureAtPixel(pixel, callback, opt_options) {}

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
   * @param {!SettingChangeEvent} event The event.
   * @protected
   */
  onSettingChange(event) {
    switch (event.type) {
      case DisplaySetting.BG_COLOR:
        var color = /** @type {string} */ (event.newVal);
        if (osColor.isColorString(color)) {
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
   * @inheritDoc
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
   * @inheritDoc
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
   * @inheritDoc
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
      AltitudeMode.ABSOLUTE
    ];
  }

  /**
   * @inheritDoc
   */
  renderSync() {}

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
    return /** @type {number} */ (Settings.getInstance().get(this.maxFeaturesKey, 150000));
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
AbstractWebGLRenderer.LOGGER_ = log.getLogger('os.webgl.AbstractWebGLRenderer');


/**
 * The settings key for tracking the active renderer
 * @type {string}
 * @const
 */
AbstractWebGLRenderer.ACTIVE_SETTINGS_KEY = 'activeWebGLRenderer';

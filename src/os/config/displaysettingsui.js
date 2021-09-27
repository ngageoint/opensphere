goog.module('os.config.DisplaySettingsUI');

const {clamp} = goog.require('goog.math');
const {ROOT} = goog.require('os');
const dispatcher = goog.require('os.Dispatcher');
const CameraMode = goog.require('os.CameraMode');
const MapMode = goog.require('os.MapMode');
const {getAppName} = goog.require('os.config');
const DisplaySetting = goog.require('os.config.DisplaySetting');
const {getSettings} = goog.require('os.config.instance');
const osMap = goog.require('os.map');
const {getMapContainer} = goog.require('os.map.instance');
const terrain = goog.require('os.map.terrain');
const {apply} = goog.require('os.ui');
const {default: Module} = goog.require('os.ui.Module');
const AbstractWebGLRenderer = goog.require('os.webgl.AbstractWebGLRenderer');

const SettingChangeEvent = goog.requireType('os.events.SettingChangeEvent');


/**
 * The display settings UI directive
 *
 * @return {angular.Directive}
 */
const directive = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: ROOT + 'views/config/displaysettings.html',
    controller: Controller,
    controllerAs: 'display'
  };
};


/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'displaysettings';


/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);


/**
 * Controller for location settings
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    const settings = getSettings();

    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;
    $scope['appName'] = getAppName('the application');

    /**
     * @type {!Object<string, string>}
     */
    this['help'] = {
      'fog': 'Fog is displayed when tilting the globe to reduce rendered tiles and terrain near the horizon. ' +
          'Disabling fog or reducing density may degrade application performance.',
      'sky': 'Show the sky/stars around the 3D globe.',
      'sunlight': 'Light the 3D scene with the Sun.',
      'terrain': 'Show terrain on the 3D globe.',
      'help2D': 'Maximum feature count for 2D mode. Valid range: 100-50,000.',
      'help3D': 'Maximum feature count for 3D mode. Valid range: 100-2,000,000',
      'resetRotation2d': 'When switching to 2D, rotation will be reset so north is up. In some situations, rotating ' +
          'the 2D map may reduce performance.'
    };

    /**
     * Flag to prevent handling settings events triggered by this controller.
     * @type {boolean}
     * @private
     */
    this.ignoreSettingsEvents_ = false;

    /**
     * Controls the current map mode (2d or 3d).
     * @type {string}
     */
    this['mapMode'] = settings.get(DisplaySetting.MAP_MODE, MapMode.VIEW_3D);
    this.scope_.$watch('display.mapMode', this.updateMapMode_.bind(this));

    var settingsState = /** @type {osx.map.CameraState|string|undefined} */ (settings.get(
        DisplaySetting.CAMERA_STATE));
    var cameraState;
    if (settingsState) {
      if (typeof settingsState === 'string') {
        try {
          cameraState = /** @type {!osx.map.CameraState} */ (JSON.parse(settingsState));
        } catch (e) {
          cameraState = undefined;
        }
      } else {
        cameraState = settingsState;
      }
    }

    /**
     * Controls how the camera is positioned when OpenSphere is launched.
     * @type {string}
     */
    this['cameraMode'] = /** @type {string} */ (settings.get(DisplaySetting.CAMERA_MODE, CameraMode.DEFAULT));
    this.scope_.$watch('display.cameraMode', this.updateCameraMode_.bind(this));

    /**
     * The camera state to use when OpenSphere is launched.
     * @type {!osx.map.CameraState}
     */
    this['cameraState'] = cameraState || this.getDefaultCameraState_();

    /**
     * If fog is enabled for WebGL rendering.
     * @type {boolean}
     */
    this['fogEnabled'] = /** @type {boolean} */ (settings.get(DisplaySetting.FOG_ENABLED, true));

    var density = clamp(/** @type {number} */ (settings.get(DisplaySetting.FOG_DENSITY, 0.5)), 0, 1);
    if (density < 0.001) {
      // density was previously stored as a Cesium value, but is now stored in the range [0..1] to indicate percent
      // on the slider
      density = 0.5;
    }

    /**
     * Globe fog density as a percent of the supported density range.
     * @type {number}
     */
    this['fogDensity'] = density;

    /**
     * If the sky is enabled on the 3D globe.
     * @type {boolean}
     */
    this['skyEnabled'] = /** @type {boolean} */ (settings.get(DisplaySetting.ENABLE_SKY, false));

    /**
     * If sunlight is enabled on the 3D globe.
     * @type {boolean}
     */
    this['sunlightEnabled'] = /** @type {boolean} */ (settings.get(DisplaySetting.ENABLE_LIGHTING, false));

    /**
     * If terrain is enabled on the 3D globe.
     * @type {boolean}
     */
    this['terrainEnabled'] = /** @type {boolean} */ (settings.get(DisplaySetting.ENABLE_TERRAIN, false));

    /**
     * Active terrain provider.
     * @type {osx.map.TerrainProviderOptions|undefined}
     */
    this['activeTerrainProvider'] = undefined;

    /**
     * Available terrain providers.
     * @type {!Array<!osx.map.TerrainProviderOptions>}
     */
    this['terrainProviders'] = [];

    /**
     * The max feature count for 2D.
     * @type {number}
     */
    this['maxFeatures2D'] = /** @type {number} */ (settings.get('maxFeatures.2d', false));

    /**
     * The max feature count for 3D. This is initialized to a value and then updated when checking for 3D support.
     * @type {number}
     */
    this['maxFeatures3D'] = 150000;

    /**
     * If rotation should be reset when switching from 3D to 2D.
     * @type {number}
     */
    this['resetRotation2d'] = /** @type {boolean} */ (settings.get(DisplaySetting.RESET_ROTATION_2D, false));

    /**
     * Need a button to reset everything if the renderer changes
     * @type {boolean}
     */
    this['resetButtonActive'] = false;

    /**
     * The available 3D renderers
     * @type {Array<Object<string, string>>}
     */
    this['renderers3D'] = this.parseRenderers_();

    /**
     * The current 3D renderer
     * @type {string|undefined}
     */
    this['renderer'] = settings.get(AbstractWebGLRenderer.ACTIVE_SETTINGS_KEY);

    $scope.$watch('display.renderer', this.updateRenderer_.bind(this));

    $scope.$watch('display.fogEnabled', this.updateFog.bind(this));
    $scope.$watch('display.fogDensity', this.updateFog.bind(this));

    dispatcher.getInstance().listen(terrain.TerrainEventType.PROVIDERS, this.onTerrainProvidersChange_, false, this);

    settings.listen(DisplaySetting.CAMERA_STATE, this.onCameraStateChange_, false, this);
    settings.listen(DisplaySetting.MAP_MODE, this.onMapModeChange_, false, this);
    settings.listen(DisplaySetting.ENABLE_SKY, this.onSkyChange_, false, this);
    settings.listen(DisplaySetting.ENABLE_LIGHTING, this.onSunlightChange_, false, this);
    settings.listen(DisplaySetting.ENABLE_TERRAIN, this.onTerrainChange_, false, this);
    settings.listen(terrain.TerrainSetting.ACTIVE_TERRAIN, this.onTerrainProviderChange_, false, this);

    // initialize 3d support
    this.update3DSupport_();

    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * @private
   */
  destroy_() {
    const settings = getSettings();

    dispatcher.getInstance().unlisten(terrain.TerrainEventType.PROVIDERS, this.onTerrainProvidersChange_, false, this);

    settings.unlisten(DisplaySetting.CAMERA_STATE, this.onCameraStateChange_, false, this);
    settings.unlisten(DisplaySetting.MAP_MODE, this.onMapModeChange_, false, this);
    settings.unlisten(DisplaySetting.ENABLE_SKY, this.onSkyChange_, false, this);
    settings.unlisten(DisplaySetting.ENABLE_LIGHTING, this.onSunlightChange_, false, this);
    settings.unlisten(DisplaySetting.ENABLE_TERRAIN, this.onTerrainChange_, false, this);
    settings.unlisten(terrain.TerrainSetting.ACTIVE_TERRAIN, this.onTerrainProviderChange_, false, this);

    this.scope_ = null;
  }

  /**
   * Update a value in settings. Sets a flag so the settings event is not handled by the controller.
   *
   * @param {string} key The settings key to update.
   * @param {*} value The new value.
   * @private
   */
  updateSetting_(key, value) {
    this.ignoreSettingsEvents_ = true;
    getSettings().set(key, value);
    this.ignoreSettingsEvents_ = false;
  }

  /**
   * @return {!osx.map.CameraState}
   * @private
   */
  getDefaultCameraState_() {
    // calculate default altitude from default zoom, given current projection
    var map = getMapContainer();
    var resolution = map.zoomToResolution(osMap.DEFAULT_ZOOM);
    var sizeObj = map.getMap().getSize();
    var altitude = osMap.distanceForResolution([sizeObj[0], sizeObj[1]], resolution);

    return /** @type {!osx.map.CameraState} */ ({
      mode: this['mapMode'],
      center: [0, 0],
      altitude: altitude,
      heading: 0,
      roll: 0,
      tilt: 0
    });
  }

  /**
   * Update the 3D support scope options.
   *
   * @private
   */
  update3DSupport_() {
    const map = getMapContainer();
    this['show3DSettings'] = map.is3DSupported();

    // update the 3D max feature count
    if (this['show3DSettings']) {
      const renderer = map.getWebGLRenderer();

      if (renderer) {
        this['maxFeatures3D'] = renderer.getMaxFeatureCount();
        this['terrainProviders'] = renderer.getSupportedTerrainProviders();
        this['activeTerrainProvider'] = renderer.getActiveTerrainProvider();
      }
    } else {
      this['terrainProviders'] = [];
      this['activeTerrainProvider'] = undefined;
    }
  }

  /**
   * Handle map mode changes via settings.
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  onCameraStateChange_(event) {
    if (!this.ignoreSettingsEvents_ && event.newVal && typeof event.newVal == 'string') {
      try {
        this['cameraState'] = /** @type {!osx.map.CameraState} */ (JSON.parse(event.newVal));
        apply(this.scope_);
      } catch (e) {}
    }
  }

  /**
   * Handle map mode changes via settings.
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  onMapModeChange_(event) {
    if (!this.ignoreSettingsEvents_ && event.newVal && event.newVal !== this['mapMode']) {
      this['mapMode'] = event.newVal;
      this.update3DSupport_();

      apply(this.scope_);
    }
  }

  /**
   * Handle map mode changes via the UI.
   *
   * @param {string=} opt_new
   * @param {string=} opt_old
   * @private
   */
  updateMapMode_(opt_new, opt_old) {
    if (opt_new && opt_old && opt_new !== opt_old) {
      this.updateSetting_(DisplaySetting.MAP_MODE, opt_new);
    }
  }

  /**
   * Handle camera mode changes via the UI.
   *
   * @param {string=} opt_new
   * @param {string=} opt_old
   * @private
   */
  updateCameraMode_(opt_new, opt_old) {
    if (opt_new && opt_old && opt_new !== opt_old) {
      this.updateSetting_(DisplaySetting.CAMERA_MODE, opt_new);

      switch (opt_new) {
        case CameraMode.DEFAULT:
          // update to the default position
          this.useDefaultPosition_();
          break;
        case CameraMode.LAST:
          // update to the current position
          this.useCurrentPosition();
          break;
        case CameraMode.FIXED:
          // switching to fixed won't change anything until the user presses the "Use Current" button
          // fall through
        default:
          break;
      }
    }
  }

  /**
   * Set OpenSphere to use the current map position on reset.
   *
   * @export
   */
  useCurrentPosition() {
    this['cameraState'] = getMapContainer().persistCameraState();
    this.updateSetting_(DisplaySetting.CAMERA_STATE, this['cameraState']);
  }

  /**
   * Set OpenSphere to use the default map position on reset.
   *
   * @private
   */
  useDefaultPosition_() {
    this['cameraState'] = this.getDefaultCameraState_();
    this.updateSetting_(DisplaySetting.CAMERA_STATE, '');
  }

  /**
   * Set OpenSphere to use the current map position on reset.
   *
   * @return {string}
   * @export
   */
  getZoom() {
    if (this['cameraState'] && this['cameraState'].altitude > 0) {
      var map = getMapContainer();
      var resolution = osMap.resolutionForDistance(map.getMap(), this['cameraState'].altitude);
      var zoom = getMapContainer().resolutionToZoom(resolution);
      return zoom.toFixed(1);
    }

    return osMap.DEFAULT_ZOOM.toFixed(1);
  }

  /**
   * Get some info about the renderers for display purposes
   * @return {Array<Object<string, string>>}
   * @private
   */
  parseRenderers_() {
    const retArr = [];
    const renderers = getMapContainer().getWebGLRenderers();
    if (renderers) {
      for (const [key, val] of Object.entries(renderers)) {
        const temp = {};
        temp['id'] = key == val.getId() ? key : Controller.DEFAULT_RENDERER_ID;
        temp['label'] = val.getLabel();
        temp['desc'] = val.getDescription();
        retArr.push(temp);
      }
    }
    return retArr.sort((a, b) => a['label'].localeCompare(b['label']));
  }

  /**
   * Renderer updated, show the button?
   * @private
   */
  updateRenderer_() {
    const currentRenderer = getMapContainer().getWebGLRenderer();
    const id = currentRenderer ? currentRenderer.getId() : undefined;
    this['resetButtonActive'] = id == this['renderer'] ? false : true;
  }

  /**
   * Update the renderer, upon apply and reset
   * @export
   */
  refreshApply() {
    const settings = getSettings();

    // default to whatever was in there before id id could not be determined
    this['renderer'] = this['renderer'] == Controller.DEFAULT_RENDERER_ID ?
          settings.get(AbstractWebGLRenderer.ACTIVE_SETTINGS_KEY) : this['renderer'];

    // use this renderer from now on
    settings.set(AbstractWebGLRenderer.ACTIVE_SETTINGS_KEY, this['renderer']);
    settings.save().then(() => {
      location.reload();
    });
  }

  /**
   * Update the fog display.
   *
   * @export
   */
  updateFog() {
    const settings = getSettings();
    settings.set(DisplaySetting.FOG_ENABLED, this['fogEnabled']);
    settings.set(DisplaySetting.FOG_DENSITY, this['fogDensity']);
  }

  /**
   * Handle changes to the sky enabled setting.
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  onSkyChange_(event) {
    if (!this.ignoreSettingsEvents_ && event.newVal !== this['skyEnabled']) {
      this['skyEnabled'] = event.newVal;
      apply(this.scope_);
    }
  }

  /**
   * Handle changes to the sunlight enabled setting.
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  onSunlightChange_(event) {
    if (!this.ignoreSettingsEvents_ && event.newVal !== this['sunlightEnabled']) {
      this['sunlightEnabled'] = event.newVal;
      apply(this.scope_);
    }
  }

  /**
   * Handle changes to the terrain enabled setting.
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  onTerrainChange_(event) {
    if (!this.ignoreSettingsEvents_ && event.newVal !== this['terrainEnabled']) {
      this['terrainEnabled'] = event.newVal;
      apply(this.scope_);
    }
  }

  /**
   * Handle changes to the terrain provider setting.
   *
   * @param {SettingChangeEvent} event
   * @private
   */
  onTerrainProviderChange_(event) {
    if (!this.ignoreSettingsEvents_) {
      const map = getMapContainer();
      const renderer = map.getWebGLRenderer();
      if (renderer) {
        const activeProvider = renderer.getActiveTerrainProvider();
        if (activeProvider !== this['activeTerrainProvider']) {
          this['activeTerrainProvider'] = activeProvider;
          apply(this.scope_);
        }
      } else {
        this['activeTerrainProvider'] = undefined;
      }
    }
  }

  /**
   * Handle changes to the application terrain providers.
   *
   * @param {goog.events.Event} event The change event.
   * @private
   */
  onTerrainProvidersChange_(event) {
    this.update3DSupport_();
  }

  /**
   * If terrain is available in the application.
   *
   * @return {boolean}
   * @export
   */
  supportsTerrain() {
    return terrain.hasTerrain();
  }

  /**
   * If fog is available in the application.
   *
   * @return {boolean}
   * @export
   */
  supportsFog() {
    var fogSupport = /** @type {boolean|undefined} */ (getSettings().get(DisplaySetting.FOG_SUPPORTED, true));
    return !!fogSupport;
  }

  /**
   * Update the globe sky display.
   *
   * @export
   */
  updateSky() {
    this.updateSetting_(DisplaySetting.ENABLE_SKY, this['skyEnabled']);
  }

  /**
   * Update the globe sunlight display.
   *
   * @export
   */
  updateSunlight() {
    this.updateSetting_(DisplaySetting.ENABLE_LIGHTING, this['sunlightEnabled']);
  }

  /**
   * Update the globe terrain display.
   *
   * @export
   */
  updateTerrainEnabled() {
    this.updateSetting_(DisplaySetting.ENABLE_TERRAIN, this['terrainEnabled']);
  }

  /**
   * Update the globe terrain provider.
   *
   * @export
   */
  updateTerrainProvider() {
    const map = getMapContainer();
    const renderer = map.getWebGLRenderer();
    if (renderer) {
      renderer.setActiveTerrainProvider(this['activeTerrainProvider']);
    }
  }

  /**
   * Update the max feature count.
   * @param {boolean} update3D Whether to update 3D or 2D.
   *
   * @export
   */
  updateMaxFeatures(update3D) {
    if (update3D) {
      const renderer = getMapContainer().getWebGLRenderer();
      if (renderer && this['maxFeatures3D'] != null) {
        renderer.setMaxFeatureCount(this['maxFeatures3D']);
      }
    } else if (this['maxFeatures2D'] != null) {
      getSettings().set('maxFeatures.2d', this['maxFeatures2D']);
    }
  }

  /**
   * Update the globe terrain display.
   *
   * @export
   */
  updateResetRotation() {
    this.updateSetting_(DisplaySetting.RESET_ROTATION_2D, this['resetRotation2d']);
  }
}


/**
 * Use this if something goes wrong with retrieving renderer ids
 * @type {string}
 * @const
 */
Controller.DEFAULT_RENDERER_ID = 'unknown';


exports = {
  directive,
  directiveTag,
  Controller
};

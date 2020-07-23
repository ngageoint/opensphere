goog.provide('os.config.DisplaySetting');
goog.provide('os.config.DisplaySettings');
goog.provide('os.config.DisplaySettingsCtrl');

goog.require('goog.userAgent');
goog.require('os.MapMode');
goog.require('os.config');
goog.require('os.defines');
goog.require('os.map');
goog.require('os.ui.Module');
goog.require('os.ui.config.SettingPlugin');
goog.require('os.ui.location.SimpleLocationControlsCtrl');
goog.require('os.ui.util.LinkyFilter');



/**
 * @extends {os.ui.config.SettingPlugin}
 * @constructor
 */
os.config.DisplaySettings = function() {
  os.config.DisplaySettings.base(this, 'constructor');

  this.setLabel('Display');
  this.setCategories(['Map']);
  this.setDescription('Start application in 2D or 3D mode');
  this.setTags(['2D', '3D', 'Dimension']);
  this.setIcon('fa fa-dashboard');
  this.setUI('displaysettings');
};
goog.inherits(os.config.DisplaySettings, os.ui.config.SettingPlugin);


/**
 * The base key used by all display settings.
 * @type {string}
 * @const
 */
os.config.DisplaySettings.BASE_KEY = 'os.map.';


/**
 * Display settings keys.
 * @enum {string}
 */
os.config.DisplaySetting = {
  // intetionally not prefixed (old setting)
  BG_COLOR: 'bgColor',

  CAMERA_STATE: os.config.DisplaySettings.BASE_KEY + 'cameraState',
  CAMERA_MODE: os.config.DisplaySettings.BASE_KEY + 'cameraMode',
  MAP_MODE: os.config.DisplaySettings.BASE_KEY + 'mapMode',
  FOG_SUPPORTED: os.config.DisplaySettings.BASE_KEY + 'fogSupported',
  FOG_ENABLED: os.config.DisplaySettings.BASE_KEY + 'fogEnabled',
  FOG_DENSITY: os.config.DisplaySettings.BASE_KEY + 'fogDensity',
  ENABLE_SKY: os.config.DisplaySettings.BASE_KEY + 'enableSky',
  ENABLE_LIGHTING: os.config.DisplaySettings.BASE_KEY + 'enableLighting',
  ENABLE_TERRAIN: os.config.DisplaySettings.BASE_KEY + 'enableTerrain',
  TERRAIN_OPTIONS: os.config.DisplaySettings.BASE_KEY + 'terrainOptions'
};


/**
 * If terrain has been configured in the application.
 *
 * @return {boolean}
 */
os.config.isTerrainConfigured = function() {
  var options = /** @type {osx.map.TerrainProviderOptions|undefined} */ (os.settings.get(
      os.config.DisplaySetting.TERRAIN_OPTIONS));
  return !!(options && options.type);
};

/**
 * If fog has been configured in the application.
 *
 * @return {boolean}
 */
os.config.isFogConfigured = function() {
  var fogSupport = /** @type {boolean|undefined} */ (os.settings.get(os.config.DisplaySetting.FOG_SUPPORTED, true));
  return !!(fogSupport);
};

/**
 * The display settings UI directive
 *
 * @return {angular.Directive}
 */
os.config.displaySettingsDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/config/displaysettings.html',
    controller: os.config.DisplaySettingsCtrl,
    controllerAs: 'display'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('displaysettings', [os.config.displaySettingsDirective]);



/**
 * Controller for location settings
 *
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.config.DisplaySettingsCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;
  $scope['appName'] = os.config.getAppName('the application');

  /**
   * @type {!Object<string, string>}
   */
  this['help'] = {
    'fog': 'Fog is displayed when tilting the globe to reduce rendered tiles and terrain near the horizon. Disabling ' +
        'fog or reducing density may degrade application performance.',
    'sky': 'Show the sky/stars around the 3D globe.',
    'sunlight': 'Light the 3D scene with the Sun.',
    'terrain': 'Show terrain on the 3D globe.',
    'help2D': 'Maximum feature count for 2D mode. Valid range: 100-50,000.',
    'help3D': 'Maximum feature count for 3D mode. Valid range: 100-2,000,000'
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
  this['mapMode'] = os.settings.get(os.config.DisplaySetting.MAP_MODE, os.MapMode.VIEW_3D);
  this.scope_.$watch('display.mapMode', this.updateMapMode_.bind(this));

  var settingsState = /** @type {string|undefined} */ (os.settings.get(os.config.DisplaySetting.CAMERA_STATE));
  var cameraState;
  if (settingsState) {
    try {
      cameraState = /** @type {!osx.map.CameraState} */ (JSON.parse(settingsState));
    } catch (e) {
      cameraState = undefined;
    }
  }

  /**
   * Controls how the camera is positioned when OpenSphere is launched.
   * @type {string}
   */
  this['cameraMode'] = /** @type {string} */ (os.settings.get(os.config.DisplaySetting.CAMERA_MODE,
      os.CameraMode.DEFAULT));
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
  this['fogEnabled'] = /** @type {boolean} */ (os.settings.get(os.config.DisplaySetting.FOG_ENABLED, true));

  var density = /** @type {number} */ (os.settings.get(os.config.DisplaySetting.FOG_DENSITY, 0.5));
  goog.math.clamp(density, 0, 1);

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
  this['skyEnabled'] = /** @type {boolean} */ (os.settings.get(os.config.DisplaySetting.ENABLE_SKY, false));

  /**
   * If sunlight is enabled on the 3D globe.
   * @type {boolean}
   */
  this['sunlightEnabled'] = /** @type {boolean} */ (os.settings.get(os.config.DisplaySetting.ENABLE_LIGHTING, false));

  /**
   * If terrain is enabled on the 3D globe.
   * @type {boolean}
   */
  this['terrainEnabled'] = /** @type {boolean} */ (os.settings.get(os.config.DisplaySetting.ENABLE_TERRAIN, false));

  /**
   * The max feature count for 2D.
   * @type {number}
   */
  this['maxFeatures2D'] = /** @type {number} */ (os.settings.get('maxFeatures.2d', false));

  /**
   * The max feature count for 3D. This is initialized to a value and then updated when checking for 3D support.
   * @type {number}
   */
  this['maxFeatures3D'] = 150000;

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
  this['renderer'] = os.settings.get(os.webgl.AbstractWebGLRenderer.ACTIVE_SETTINGS_KEY);

  $scope.$watch('display.renderer', this.updateRenderer_.bind(this));

  $scope.$watch('display.fogEnabled', this.updateFog.bind(this));
  $scope.$watch('display.fogDensity', this.updateFog.bind(this));

  os.settings.listen(os.config.DisplaySetting.CAMERA_STATE, this.onCameraStateChange_, false, this);
  os.settings.listen(os.config.DisplaySetting.MAP_MODE, this.onMapModeChange_, false, this);
  os.settings.listen(os.config.DisplaySetting.ENABLE_SKY, this.onSkyChange_, false, this);
  os.settings.listen(os.config.DisplaySetting.ENABLE_LIGHTING, this.onSunlightChange_, false, this);
  os.settings.listen(os.config.DisplaySetting.ENABLE_TERRAIN, this.onTerrainChange_, false, this);

  // initialize 3d support
  this.update3DSupport_();

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Use this if something goes wrong with retrieving renderer ids
 * @type {string}
 * @const
 */
os.config.DisplaySettingsCtrl.DEFAULT_RENDERER_ID = 'unknown';


/**
 * @private
 */
os.config.DisplaySettingsCtrl.prototype.destroy_ = function() {
  os.settings.unlisten(os.config.DisplaySetting.CAMERA_STATE, this.onCameraStateChange_, false, this);
  os.settings.unlisten(os.config.DisplaySetting.MAP_MODE, this.onMapModeChange_, false, this);
  os.settings.unlisten(os.config.DisplaySetting.ENABLE_SKY, this.onSkyChange_, false, this);
  os.settings.unlisten(os.config.DisplaySetting.ENABLE_LIGHTING, this.onSunlightChange_, false, this);
  os.settings.unlisten(os.config.DisplaySetting.ENABLE_TERRAIN, this.onTerrainChange_, false, this);

  this.scope_ = null;
};


/**
 * Update a value in settings. Sets a flag so the settings event is not handled by the controller.
 *
 * @param {string} key The settings key to update.
 * @param {*} value The new value.
 * @private
 */
os.config.DisplaySettingsCtrl.prototype.updateSetting_ = function(key, value) {
  if (os.settings) {
    this.ignoreSettingsEvents_ = true;
    os.settings.set(key, value);
    this.ignoreSettingsEvents_ = false;
  }
};


/**
 * @return {!osx.map.CameraState}
 * @private
 */
os.config.DisplaySettingsCtrl.prototype.getDefaultCameraState_ = function() {
  // calculate default altitude from default zoom, given current projection
  var map = os.MapContainer.getInstance();
  var resolution = map.zoomToResolution(os.map.DEFAULT_ZOOM);
  var sizeObj = map.getMap().getSize();
  var altitude = os.map.distanceForResolution([sizeObj[0], sizeObj[1]], resolution);

  return /** @type {!osx.map.CameraState} */ ({
    mode: this['mapMode'],
    center: [0, 0],
    altitude: altitude,
    heading: 0,
    roll: 0,
    tilt: 0
  });
};


/**
 * Update the 3D support scope options.
 *
 * @private
 */
os.config.DisplaySettingsCtrl.prototype.update3DSupport_ = function() {
  const map = os.MapContainer.getInstance();
  this['show3DSettings'] = map.is3DSupported();

  // update the 3D max feature count
  if (this['show3DSettings']) {
    const renderer = map.getWebGLRenderer();

    if (renderer) {
      this['maxFeatures3D'] = renderer.getMaxFeatureCount();
    }
  }
};


/**
 * Handle map mode changes via settings.
 *
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.config.DisplaySettingsCtrl.prototype.onCameraStateChange_ = function(event) {
  if (!this.ignoreSettingsEvents_ && event.newVal && typeof event.newVal == 'string') {
    try {
      this['cameraState'] = /** @type {!osx.map.CameraState} */ (JSON.parse(event.newVal));
      os.ui.apply(this.scope_);
    } catch (e) {}
  }
};


/**
 * Handle map mode changes via settings.
 *
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.config.DisplaySettingsCtrl.prototype.onMapModeChange_ = function(event) {
  if (!this.ignoreSettingsEvents_ && event.newVal && event.newVal !== this['mapMode']) {
    this['mapMode'] = event.newVal;
    this.update3DSupport_();

    os.ui.apply(this.scope_);
  }
};


/**
 * Handle map mode changes via the UI.
 *
 * @param {string=} opt_new
 * @param {string=} opt_old
 * @private
 */
os.config.DisplaySettingsCtrl.prototype.updateMapMode_ = function(opt_new, opt_old) {
  if (opt_new && opt_old && opt_new !== opt_old) {
    this.updateSetting_(os.config.DisplaySetting.MAP_MODE, opt_new);
  }
};


/**
 * Handle camera mode changes via the UI.
 *
 * @param {string=} opt_new
 * @param {string=} opt_old
 * @private
 */
os.config.DisplaySettingsCtrl.prototype.updateCameraMode_ = function(opt_new, opt_old) {
  if (opt_new && opt_old && opt_new !== opt_old) {
    this.updateSetting_(os.config.DisplaySetting.CAMERA_MODE, opt_new);

    switch (opt_new) {
      case os.CameraMode.DEFAULT:
        // update to the default position
        this.useDefaultPosition_();
        break;
      case os.CameraMode.LAST:
        // update to the current position
        this.useCurrentPosition();
        break;
      case os.CameraMode.FIXED:
        // switching to fixed won't change anything until the user presses the "Use Current" button
        // fall through
      default:
        break;
    }
  }
};


/**
 * Set OpenSphere to use the current map position on reset.
 *
 * @export
 */
os.config.DisplaySettingsCtrl.prototype.useCurrentPosition = function() {
  this['cameraState'] = os.MapContainer.getInstance().persistCameraState();

  if (os.settings) {
    this.updateSetting_(os.config.DisplaySetting.CAMERA_STATE, this['cameraState']);
  }
};


/**
 * Set OpenSphere to use the default map position on reset.
 *
 * @private
 */
os.config.DisplaySettingsCtrl.prototype.useDefaultPosition_ = function() {
  this['cameraState'] = this.getDefaultCameraState_();

  if (os.settings) {
    this.updateSetting_(os.config.DisplaySetting.CAMERA_STATE, '');
  }
};


/**
 * Set OpenSphere to use the current map position on reset.
 *
 * @return {string}
 * @export
 */
os.config.DisplaySettingsCtrl.prototype.getZoom = function() {
  if (this['cameraState'] && this['cameraState'].altitude > 0) {
    var map = os.MapContainer.getInstance();
    var resolution = os.map.resolutionForDistance(map.getMap(), this['cameraState'].altitude);
    var zoom = os.MapContainer.getInstance().resolutionToZoom(resolution);
    return zoom.toFixed(1);
  }

  return os.map.DEFAULT_ZOOM.toFixed(1);
};


/**
 * Get some info about the renderers for display purposes
 * @return {Array<Object<string, string>>}
 * @private
 */
os.config.DisplaySettingsCtrl.prototype.parseRenderers_ = function() {
  const retArr = [];
  const renderers = os.MapContainer.getInstance().getWebGLRenderers();
  if (renderers) {
    for (const [key, val] of Object.entries(renderers)) {
      const temp = {};
      temp['id'] = key == val.getId() ? key : os.config.DisplaySettingsCtrl.DEFAULT_RENDERER_ID;
      temp['label'] = val.getLabel();
      temp['desc'] = val.getDescription();
      retArr.push(temp);
    }
  }
  return retArr.sort((a, b) => a['label'].localeCompare(b['label']));
};


/**
 * Renderer updated, show the button?
 * @private
 */
os.config.DisplaySettingsCtrl.prototype.updateRenderer_ = function() {
  const currentRenderer = os.MapContainer.getInstance().getWebGLRenderer();
  const id = currentRenderer ? currentRenderer.getId() : undefined;
  this['resetButtonActive'] = id == this['renderer'] ? false : true;
};


/**
 * Update the renderer, upon apply and reset
 * @export
 */
os.config.DisplaySettingsCtrl.prototype.refreshApply = function() {
  // default to whatever was in there before id id could not be determined
  this['renderer'] = this['renderer'] == os.config.DisplaySettingsCtrl.DEFAULT_RENDERER_ID ?
        os.settings.get(os.webgl.AbstractWebGLRenderer.ACTIVE_SETTINGS_KEY) : this['renderer'];

  // use this renderer from now on
  os.settings.set(os.webgl.AbstractWebGLRenderer.ACTIVE_SETTINGS_KEY, this['renderer']);
  os.settings.save().then(() => {
    location.reload();
  });
};


/**
 * Update the fog display.
 *
 * @export
 */
os.config.DisplaySettingsCtrl.prototype.updateFog = function() {
  os.settings.set(os.config.DisplaySetting.FOG_ENABLED, this['fogEnabled']);
  os.settings.set(os.config.DisplaySetting.FOG_DENSITY, this['fogDensity']);
};


/**
 * Handle changes to the sky enabled setting.
 *
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.config.DisplaySettingsCtrl.prototype.onSkyChange_ = function(event) {
  if (!this.ignoreSettingsEvents_ && event.newVal !== this['skyEnabled']) {
    this['skyEnabled'] = event.newVal;
    os.ui.apply(this.scope_);
  }
};


/**
 * Handle changes to the sunlight enabled setting.
 *
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.config.DisplaySettingsCtrl.prototype.onSunlightChange_ = function(event) {
  if (!this.ignoreSettingsEvents_ && event.newVal !== this['sunlightEnabled']) {
    this['sunlightEnabled'] = event.newVal;
    os.ui.apply(this.scope_);
  }
};


/**
 * Handle changes to the terrain enabled setting.
 *
 * @param {os.events.SettingChangeEvent} event
 * @private
 */
os.config.DisplaySettingsCtrl.prototype.onTerrainChange_ = function(event) {
  if (!this.ignoreSettingsEvents_ && event.newVal !== this['terrainEnabled']) {
    this['terrainEnabled'] = event.newVal;
    os.ui.apply(this.scope_);
  }
};


/**
 * If terrain is available in the application.
 *
 * @return {boolean}
 * @export
 */
os.config.DisplaySettingsCtrl.prototype.supportsTerrain = function() {
  return os.config.isTerrainConfigured();
};

/**
 * If fog is available in the application.
 *
 * @return {boolean}
 * @export
 */
os.config.DisplaySettingsCtrl.prototype.supportsFog = function() {
  return os.config.isFogConfigured();
};


/**
 * Update the globe sky display.
 *
 * @export
 */
os.config.DisplaySettingsCtrl.prototype.updateSky = function() {
  this.updateSetting_(os.config.DisplaySetting.ENABLE_SKY, this['skyEnabled']);
};


/**
 * Update the globe sunlight display.
 *
 * @export
 */
os.config.DisplaySettingsCtrl.prototype.updateSunlight = function() {
  this.updateSetting_(os.config.DisplaySetting.ENABLE_LIGHTING, this['sunlightEnabled']);
};


/**
 * Update the globe terrain display.
 *
 * @export
 */
os.config.DisplaySettingsCtrl.prototype.updateTerrain = function() {
  this.updateSetting_(os.config.DisplaySetting.ENABLE_TERRAIN, this['terrainEnabled']);
};


/**
 * Update the max feature count.
 * @param {boolean} update3D Whether to update 3D or 2D.
 *
 * @export
 */
os.config.DisplaySettingsCtrl.prototype.updateMaxFeatures = function(update3D) {
  if (update3D) {
    const renderer = os.MapContainer.getInstance().getWebGLRenderer();
    if (renderer && this['maxFeatures3D'] != null) {
      renderer.setMaxFeatureCount(this['maxFeatures3D']);
    }
  } else if (this['maxFeatures2D'] != null) {
    os.settings.set('maxFeatures.2d', this['maxFeatures2D']);
  }
};

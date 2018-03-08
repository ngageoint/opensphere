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
  CAMERA_STATE: os.config.DisplaySettings.BASE_KEY + 'cameraState',
  CAMERA_MODE: os.config.DisplaySettings.BASE_KEY + 'cameraMode',
  MAP_MODE: os.config.DisplaySettings.BASE_KEY + 'mapMode',
  FOG_ENABLED: os.config.DisplaySettings.BASE_KEY + 'fogEnabled',
  FOG_DENSITY: os.config.DisplaySettings.BASE_KEY + 'fogDensity',
  ENABLE_LIGHTING: os.config.DisplaySettings.BASE_KEY + 'enableLighting',
  ENABLE_TERRAIN: os.config.DisplaySettings.BASE_KEY + 'enableTerrain'
};


/**
 * The display settings UI directive
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
    'sunlight': 'Light the 3D scene with the Sun.',
    'terrain': 'Show terrain on the 3D globe.'
  };

  os.settings.listen(os.config.DisplaySetting.CAMERA_STATE, this.onCameraStateChange_, false, this);
  os.settings.listen(os.config.DisplaySetting.MAP_MODE, this.onMapModeChange_, false, this);
  os.settings.listen(os.config.DisplaySetting.ENABLE_LIGHTING, this.onSunlightChange_, false, this);
  os.settings.listen(os.config.DisplaySetting.ENABLE_TERRAIN, this.onTerrainChange_, false, this);

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

  var settingsState = /** @type {string|undefined} */ (os.settings.get(
      os.config.DisplaySetting.CAMERA_STATE));
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
   * If Cesium fog is enabled.
   * @type {boolean}
   */
  this['fogEnabled'] = /** @type {boolean} */ (os.settings.get(os.config.DisplaySetting.FOG_ENABLED,
      true));


  var density = /** @type {number} */ (os.settings.get(os.config.DisplaySetting.FOG_DENSITY,
      os.olcs.DEFAULT_FOG_DENSITY));

  /**
   * Globe fog density as a percent of the supported density range.
   * @type {number}
   */
  this['fogDensity'] = density / os.olcs.MAX_FOG_DENSITY;

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

  $scope.$watch('display.fogEnabled', this.updateFog.bind(this));
  $scope.$watch('display.fogDensity', this.updateFog.bind(this));

  // initialize 3d support
  this.update3DSupport_();

  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * @private
 */
os.config.DisplaySettingsCtrl.prototype.destroy_ = function() {
  os.settings.unlisten(os.config.DisplaySetting.CAMERA_STATE, this.onCameraStateChange_, false, this);
  os.settings.unlisten(os.config.DisplaySetting.MAP_MODE, this.onMapModeChange_, false, this);
  os.settings.unlisten(os.config.DisplaySetting.ENABLE_LIGHTING, this.onSunlightChange_, false, this);
  os.settings.unlisten(os.config.DisplaySetting.ENABLE_TERRAIN, this.onTerrainChange_, false, this);

  this.scope_ = null;
};


/**
 * Update a value in settings. Sets a flag so the settings event is not handled by the controller.
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
 * @private
 */
os.config.DisplaySettingsCtrl.prototype.update3DSupport_ = function() {
  this['show3DSettings'] = os.MapContainer.getInstance().is3DSupported();

  // set browser-specific scope options
  if (this['show3DSettings']) {
    this.scope_['showIEHelp'] = false;
    this.scope_['showFFHelp'] = false;
    this.scope_['showGCHelp'] = false;
  } else if (goog.userAgent.IE && goog.userAgent.VERSION == 11) {
    this.scope_['showIEHelp'] = true;
  } else if (goog.userAgent.GECKO && goog.userAgent.isVersionOrHigher(10)) {
    this.scope_['showFFHelp'] = true;
  } else if (goog.userAgent.WEBKIT && goog.userAgent.isVersionOrHigher(28)) {
    this.scope_['showGCHelp'] = true;
  }
};


/**
 * Handle map mode changes via settings.
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
 */
os.config.DisplaySettingsCtrl.prototype.useCurrentPosition = function() {
  this['cameraState'] = os.MapContainer.getInstance().persistCameraState();

  if (os.settings) {
    this.updateSetting_(os.config.DisplaySetting.CAMERA_STATE, JSON.stringify(this['cameraState']));
  }
};
goog.exportProperty(
    os.config.DisplaySettingsCtrl.prototype,
    'useCurrentPosition',
    os.config.DisplaySettingsCtrl.prototype.useCurrentPosition);


/**
 * Set OpenSphere to use the default map position on reset.
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
 * @return {string}
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
goog.exportProperty(
    os.config.DisplaySettingsCtrl.prototype,
    'getZoom',
    os.config.DisplaySettingsCtrl.prototype.getZoom);


/**
 * Update the Cesium fog display.
 */
os.config.DisplaySettingsCtrl.prototype.updateFog = function() {
  var map = os.MapContainer.getInstance();
  var scene = map.getCesiumScene();
  if (scene) {
    var newDensity = this['fogDensity'] * os.olcs.MAX_FOG_DENSITY;
    os.settings.set(os.config.DisplaySetting.FOG_ENABLED, this['fogEnabled']);
    os.settings.set(os.config.DisplaySetting.FOG_DENSITY, newDensity);

    scene.fog.enabled = this['fogEnabled'];
    scene.fog.density = newDensity;

    os.dispatcher.dispatchEvent(os.olcs.RenderLoop.REPAINT);
  }
};
goog.exportProperty(
    os.config.DisplaySettingsCtrl.prototype,
    'updateFog',
    os.config.DisplaySettingsCtrl.prototype.updateFog);


/**
 * Handle changes to the sunlight enabled setting.
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
 * Update the globe sunlight display.
 */
os.config.DisplaySettingsCtrl.prototype.updateSunlight = function() {
  this.updateSetting_(os.config.DisplaySetting.ENABLE_LIGHTING, this['sunlightEnabled']);
};
goog.exportProperty(
    os.config.DisplaySettingsCtrl.prototype,
    'updateSunlight',
    os.config.DisplaySettingsCtrl.prototype.updateSunlight);


/**
 * Update the globe terrain display.
 */
os.config.DisplaySettingsCtrl.prototype.updateTerrain = function() {
  this.updateSetting_(os.config.DisplaySetting.ENABLE_TERRAIN, this['terrainEnabled']);
};
goog.exportProperty(
    os.config.DisplaySettingsCtrl.prototype,
    'updateTerrain',
    os.config.DisplaySettingsCtrl.prototype.updateTerrain);

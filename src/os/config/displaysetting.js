goog.module('os.config.DisplaySetting');

/**
 * The base key used by all display settings.
 * @type {string}
 */
const baseKey = 'os.map.';

/**
 * Display settings keys.
 * @enum {string}
 */
exports = {
  // intetionally not prefixed (old setting)
  BG_COLOR: 'bgColor',

  CAMERA_STATE: baseKey + 'cameraState',
  CAMERA_MODE: baseKey + 'cameraMode',
  MAP_MODE: baseKey + 'mapMode',
  FOG_SUPPORTED: baseKey + 'fogSupported',
  FOG_ENABLED: baseKey + 'fogEnabled',
  FOG_DENSITY: baseKey + 'fogDensity',
  ENABLE_SKY: baseKey + 'enableSky',
  ENABLE_LIGHTING: baseKey + 'enableLighting',
  ENABLE_TERRAIN: baseKey + 'enableTerrain',
  RESET_ROTATION_2D: baseKey + 'resetRotation2d'
};

goog.module('os.webgl.AltitudeMode');


/**
 * Represents altitude value relative to terrain.
 * @enum {string}
 */
exports = {
  /** Altitude value is ignored and value is clamped to terrain */
  CLAMP_TO_GROUND: 'clampToGround',
  /** Altitude value is absolute to mean sea level */
  ABSOLUTE: 'absolute',
  /** Altitude value is relative to terrain */
  RELATIVE_TO_GROUND: 'relativeToGround',
  /** Altitude value is ignored and value is clamped to the sea floor */
  CLAMP_TO_SEA_FLOOR: 'clampToSeaFloor',
  /** Altitude value is relative to the sea floor */
  RELATIVE_TO_SEAFLOOR: 'relativeToSeaFloor'
};

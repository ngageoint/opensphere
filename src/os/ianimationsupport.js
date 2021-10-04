goog.declareModuleId('os.IAnimationSupport');

/**
 * Interface for a layer or source that responds to timeline animation.
 * @interface
 */
export default class IAnimationSupport {
  /**
   * If animation is enabled.
   * @return {boolean}
   */
  getAnimationEnabled() {}

  /**
   * Set if animation is enabled.
   * @param {boolean} value The value.
   */
  setAnimationEnabled(value) {}
}

/**
 * ID for {@see os.implements}
 * @type {string}
 */
IAnimationSupport.ID = 'os.IAnimationSupport';

goog.module('os.IAnimationSupport');
goog.module.declareLegacyNamespace();

/**
 * Interface for a layer or source that responds to timeline animation.
 * @interface
 */
class IAnimationSupport {
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

exports = IAnimationSupport;

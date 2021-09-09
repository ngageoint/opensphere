goog.module('os.layer.IColorableLayer');

/**
 * Interface for layers that support coloring.
 *
 * @interface
 */
class IColorableLayer {
  /**
   * Get the layer color.
   * @return {?string} The layer color.
   */
  getColor() {}

  /**
   * Set the layer color.
   * @param {?string} value The new color.
   * @param {Object=} opt_options The layer options object.
   */
  setColor(value, opt_options) {}
}

/**
 * ID for {@see os.implements}
 * @const {string}
 */
IColorableLayer.ID = 'os.layer.IColorableLayer';

exports = IColorableLayer;

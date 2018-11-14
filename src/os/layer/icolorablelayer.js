goog.provide('os.layer.IColorableLayer');


/**
 * Interface for layers that support coloring.
 * @interface
 */
os.layer.IColorableLayer = function() {};


/**
 * ID for {@see os.implements}
 * @const {string}
 */
os.layer.IColorableLayer.ID = 'os.layer.IColorableLayer';


/**
 * Get the layer color.
 * @return {?string} The layer color.
 */
os.layer.IColorableLayer.prototype.getColor;


/**
 * Set the layer color.
 * @param {?string} value The new color.
 * @param {Object=} opt_options The layer options object.
 */
os.layer.IColorableLayer.prototype.setColor;

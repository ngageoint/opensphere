goog.provide('os.layer.ICustomLayerVisible');
goog.require('os.implements');



/**
 * The interface for layers with custom layer visibility requirements
 * @interface
 *
 */
os.layer.ICustomLayerVisible = function() {};


/**
 * ID for {@see os.implements}
 * @const {string}
 */
os.layer.ICustomLayerVisible.ID = 'os.layer.ICustomLayerVisible';


/**
 * Gets the layer ID
 * @return {!string} The ID
 */
os.layer.ICustomLayerVisible.prototype.getId;


/**
 * Sets the layer ID
 * @param {!string} value The ID
 */
os.layer.ICustomLayerVisible.prototype.setId;

/**
 * Whether or not the layer is visible
 * @return {boolean}
 */
os.layer.ICustomLayerVisible.prototype.getCustomLayerVisible;


/**
 * Sets whether or not the layer is visible
 * @param {boolean} value
 */
os.layer.ICustomLayerVisible.prototype.setCustomLayerVisible;

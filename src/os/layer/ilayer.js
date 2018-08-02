goog.provide('os.layer.ILayer');
goog.require('os.IPersistable');
goog.require('os.filter.IFilterable');
goog.require('os.implements');
goog.require('os.ui.action.IActionTarget');



/**
 * The interface for layers
 * @interface
 *
 * @extends {os.IPersistable}
 * @extends {os.ui.action.IActionTarget}
 */
os.layer.ILayer = function() {};


/**
 * ID for {@see os.implements}
 * @const {string}
 */
os.layer.ILayer.ID = 'os.layer.ILayer';


/**
 * Gets the layer ID
 * @return {!string} The ID
 */
os.layer.ILayer.prototype.getId;


/**
 * Sets the layer ID
 * @param {!string} value The ID
 */
os.layer.ILayer.prototype.setId;


/**
 * Get the layer source.
 * @return {ol.source.Source} The layer source (or `null` if not yet set).
 */
os.layer.ILayer.prototype.getSource;


/**
 * Whether or not the layer is loading
 * @return {boolean}
 */
os.layer.ILayer.prototype.isLoading;


/**
 * Sets whether or not the layer is loading
 * @param {boolean} value
 */
os.layer.ILayer.prototype.setLoading;


/**
 * Gets the layer title
 * @return {!string} The title
 */
os.layer.ILayer.prototype.getTitle;


/**
 * Sets the layer title
 * @param {!string} value The title
 */
os.layer.ILayer.prototype.setTitle;


/**
 * Gets the icons for the layer
 * @return {!string} The HTML for the icons
 */
os.layer.ILayer.prototype.getIcons;


/**
 * Gets the layer type
 * @return {?string} The type
 */
os.layer.ILayer.prototype.getOSType;


/**
 * Sets the layer type
 * @param {?string} value The type
 */
os.layer.ILayer.prototype.setOSType;


/**
 * Gets the explicit layer type, which may differ from <code>getOSType()</code>
 * @return {!string}
 */
os.layer.ILayer.prototype.getExplicitType;


/**
 * Sets the explicit layer type, which may differ from <code>getOSType()</code>
 * @param {!string} value The explicit type
 */
os.layer.ILayer.prototype.setExplicitType;


/**
 * Gets the title of the thing that provided the layer
 * @return {?string} The title
 */
os.layer.ILayer.prototype.getProvider;


/**
 * Gets the title of the thing that provided the layer
 * @param {?string} value The title
 */
os.layer.ILayer.prototype.setProvider;


/**
 * Gets the brightness of the layer
 * @return {number|undefined} between 0 and 1
 */
os.layer.ILayer.prototype.getBrightness;


/**
 * Sets the brightness of the layer
 * @param {number} value Number between 0 and 1
 */
os.layer.ILayer.prototype.setBrightness;


/**
 * Gets the contrast of the layer
 * @return {number|undefined} between 0 and 1
 */
os.layer.ILayer.prototype.getContrast;


/**
 * Sets the contrast of the layer
 * @param {number} value Number between 0 and 1
 */
os.layer.ILayer.prototype.setContrast;


/**
 * Gets the hue of the layer
 * @return {number|undefined} between -180 and 180
 */
os.layer.ILayer.prototype.getHue;


/**
 * Sets the hue of the layer
 * @param {number} value Number between -180 and 180
 */
os.layer.ILayer.prototype.setHue;


/**
 * Gets the opacity of the layer
 * @return {number|undefined} between 0 and 1
 */
os.layer.ILayer.prototype.getOpacity;


/**
 * Sets the opacity of the layer
 * @param {number} value Number between 0 and 1
 */
os.layer.ILayer.prototype.setOpacity;


/**
 * Gets the saturation of the layer
 * @return {number|undefined} between 0 and 1
 */
os.layer.ILayer.prototype.getSaturation;


/**
 * Sets the saturation of the layer
 * @param {number} value Number between 0 and 1
 */
os.layer.ILayer.prototype.setSaturation;


/**
 * Whether or not the layer is visible
 * @return {boolean}
 */
os.layer.ILayer.prototype.getLayerVisible;


/**
 * Sets whether or not the layer is visible
 * @param {boolean} value
 */
os.layer.ILayer.prototype.setLayerVisible;


/**
 * Calls the set for the base layer directly
 * @param {boolean} value
 */
os.layer.ILayer.prototype.setBaseVisible;


/**
 * Get the base layer visibility directly
 * @return {boolean}
 */
os.layer.ILayer.prototype.getBaseVisible;


/**
 * Get the tags for the layer
 * @return {?Array.<!string>} The tags
 */
os.layer.ILayer.prototype.getTags;


/**
 * Set the tags for the layer
 * @param {?Array.<!string>} value The tags
 */
os.layer.ILayer.prototype.setTags;


/**
 * Configuration options for the layer
 * @return {Object.<string, *>} The options
 */
os.layer.ILayer.prototype.getLayerOptions;


/**
 * Set the configuration options for the layer
 * @param {Object.<string, *>} value The options
 */
os.layer.ILayer.prototype.setLayerOptions;


/**
 * Gets the layer tree node UI displayed on hover/selection.
 * @return {!string}
 */
os.layer.ILayer.prototype.getNodeUI = goog.abstractMethod;


/**
 * Sets the layer tree node UI displayed on hover/selection.
 * @param {!string} value
 */
os.layer.ILayer.prototype.setNodeUI;


/**
 * Gets the group node UI for this layer
 * @return {?string}
 */
os.layer.ILayer.prototype.getGroupUI = goog.abstractMethod;


/**
 * Gets the layer controls UI.
 * @return {!string}
 */
os.layer.ILayer.prototype.getLayerUI = goog.abstractMethod;


/**
 * Sets the layer controls UI.
 * @param {!string} value
 */
os.layer.ILayer.prototype.setLayerUI;


/**
 * Get whether the layer is hidden from layer display UIs.
 * @return {boolean}
 */
os.layer.ILayer.prototype.getHidden;


/**
 * Set whether the layer is hidden from layer display UIs.
 * @param {boolean} value
 */
os.layer.ILayer.prototype.setHidden;


/**
 * Check if the layer is removable.
 * @return {boolean} Whether or not the layer is removable
 */
os.layer.ILayer.prototype.isRemovable;


/**
 * Set if the layer is removable.
 * @param {boolean} value Whether or not the layer is removable
 */
os.layer.ILayer.prototype.setRemovable;


/**
 * Gets the type of synchronizer used for the layer. Returns null if the layer shouldn't be synced.
 * @return {?string}
 */
os.layer.ILayer.prototype.getSynchronizerType;


/**
 * Set the type of synchronizer used for the layer.
 * @param {?string} value
 */
os.layer.ILayer.prototype.setSynchronizerType;

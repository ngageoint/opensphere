goog.declareModuleId('os.layer.ILayer');

/**
 * The interface for layers
 *
 * @interface
 *
 * @extends {IPersistable}
 * @extends {IActionTarget}
 */
export default class ILayer {
  /**
   * Gets the layer ID
   * @return {!string} The ID
   */
  getId() {}

  /**
   * Sets the layer ID
   * @param {!string} value The ID
   */
  setId(value) {}

  /**
   * Get the layer source.
   * @return {Source} The layer source (or `null` if not yet set).
   */
  getSource() {}

  /**
   * Whether or not the layer is enabled
   * @return {boolean}
   */
  isEnabled() {}

  /**
   * Sets whether or not the layer is enabled
   * @param {boolean} value
   */
  setEnabled(value) {}

  /**
   * Whether or not the layer is loading
   * @return {boolean}
   */
  isLoading() {}

  /**
   * Sets whether or not the layer is loading
   * @param {boolean} value
   */
  setLoading(value) {}

  /**
   * Gets the layer title
   * @return {!string} The title
   */
  getTitle() {}

  /**
   * Sets the layer title
   * @param {!string} value The title
   */
  setTitle(value) {}

  /**
   * Gets the icons for the layer
   * @return {!string} The HTML for the icons
   */
  getIcons() {}

  /**
   * Gets the layer type
   * @return {?string} The type
   */
  getOSType() {}

  /**
   * Sets the layer type
   * @param {?string} value The type
   */
  setOSType(value) {}

  /**
   * Gets the explicit layer type, which may differ from <code>getOSType()</code>
   * @return {!string}
   */
  getExplicitType() {}

  /**
   * Sets the explicit layer type, which may differ from <code>getOSType()</code>
   * @param {!string} value The explicit type
   */
  setExplicitType(value) {}

  /**
   * Gets the title of the thing that provided the layer
   * @return {?string} The title
   */
  getProvider() {}

  /**
   * Gets the title of the thing that provided the layer
   * @param {?string} value The title
   */
  setProvider(value) {}

  /**
   * Gets the brightness of the layer
   * @return {number|undefined} between 0 and 1
   */
  getBrightness() {}

  /**
   * Sets the brightness of the layer
   * @param {number} value Number between 0 and 1
   */
  setBrightness(value) {}

  /**
   * Gets the contrast of the layer
   * @return {number|undefined} between 0 and 1
   */
  getContrast() {}

  /**
   * Sets the contrast of the layer
   * @param {number} value Number between 0 and 1
   */
  setContrast(value) {}

  /**
   * Gets the hue of the layer
   * @return {number|undefined} between -180 and 180
   */
  getHue() {}

  /**
   * Sets the hue of the layer
   * @param {number} value Number between -180 and 180
   */
  setHue(value) {}

  /**
   * Gets the opacity of the layer
   * @return {number|undefined} between 0 and 1
   */
  getOpacity() {}

  /**
   * Sets the opacity of the layer
   * @param {number} value Number between 0 and 1
   */
  setOpacity(value) {}

  /**
   * Gets the saturation of the layer
   * @return {number|undefined} between 0 and 1
   */
  getSaturation() {}

  /**
   * Sets the saturation of the layer
   * @param {number} value Number between 0 and 1
   */
  setSaturation(value) {}

  /**
   * Gets the sharpness of the layer
   * @return {number|undefined} between 0 and 1
   */
  getSharpness() {}

  /**
   * Sets the sharpness of the layer
   * @param {number} value Number between 0 and 1
   */
  setSharpness(value) {}

  /**
   * Whether or not the layer is visible
   * @return {boolean}
   */
  getLayerVisible() {}

  /**
   * Sets whether or not the layer is visible
   * @param {boolean} value
   */
  setLayerVisible(value) {}

  /**
   * Calls the set for the base layer directly
   * @param {boolean} value
   */
  setBaseVisible(value) {}

  /**
   * Get the base layer visibility directly
   * @return {boolean}
   */
  getBaseVisible() {}

  /**
   * Get the tags for the layer
   * @return {?Array<!string>} The tags
   */
  getTags() {}

  /**
   * Set the tags for the layer
   * @param {?Array<!string>} value The tags
   */
  setTags(value) {}

  /**
   * Configuration options for the layer
   * @return {Object<string, *>} The options
   */
  getLayerOptions() {}

  /**
   * Set the configuration options for the layer
   * @param {Object<string, *>} value The options
   */
  setLayerOptions(value) {}

  /**
   * Gets the layer tree node UI displayed on hover/selection.
   * @return {!string}
   */
  getNodeUI() {}

  /**
   * Sets the layer tree node UI displayed on hover/selection.
   * @param {!string} value
   */
  setNodeUI(value) {}

  /**
   * Gets the group node UI for this layer
   * @return {?string}
   */
  getGroupUI() {}

  /**
   * Gets the layer controls UI.
   * @return {!string}
   */
  getLayerUI() {}

  /**
   * Sets the layer controls UI.
   * @param {!string} value
   */
  setLayerUI(value) {}

  /**
   * Get whether the layer is hidden from layer display UIs.
   * @return {boolean}
   */
  getHidden() {}

  /**
   * Set whether the layer is hidden from layer display UIs.
   * @param {boolean} value
   */
  setHidden(value) {}

  /**
   * Check if the layer is removable.
   * @return {boolean} Whether or not the layer is removable
   */
  isRemovable() {}

  /**
   * Set if the layer is removable.
   * @param {boolean} value Whether or not the layer is removable
   */
  setRemovable(value) {}

  /**
   * Gets the type of synchronizer used for the layer. Returns null if the layer shouldn't be synced.
   * @return {?string}
   */
  getSynchronizerType() {}

  /**
   * Set the type of synchronizer used for the layer.
   * @param {?string} value
   */
  setSynchronizerType(value) {}
}

/**
 * ID for {@see osImplements}
 * @const {string}
 */
ILayer.ID = 'os.layer.ILayer';

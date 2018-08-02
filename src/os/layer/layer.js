goog.provide('os.layer');
goog.provide('os.layer.SynchronizerType');

goog.require('goog.Timer');
goog.require('goog.log');
goog.require('os.layer.ILayer');
goog.require('os.layer.config.LayerConfigManager');
goog.require('os.source.ISource');


/**
 * Enumeration of available base synchronizer types.
 * @enum {string}
 * @const
 */
os.layer.SynchronizerType = {
  VECTOR: 'vector',
  TILE: 'tile',
  IMAGE: 'image',
  DRAW: 'draw'
};


/**
 * Layer option keys.
 * @enum {string}
 */
os.layer.LayerOption = {
  SHOW_FORCE_COLOR: 'showForceColor'
};


/**
 * Logger for os.layer
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.layer.LOGGER_ = goog.log.getLogger('os.layer');


/**
 * Creates a layer from an options object.
 * @param {!Object<string, *>} options The layer options
 * @return {os.layer.ILayer}
 */
os.layer.createFromOptions = function(options) {
  var layer;
  var layerType = /** @type {string} */ (options['type']);
  if (!layerType) {
    goog.log.error(os.layer.LOGGER_, 'Layer type missing!');
    return null;
  }

  var layerConfig = os.layer.config.LayerConfigManager.getInstance().getLayerConfig(layerType);
  if (!layerConfig) {
    goog.log.error(os.layer.LOGGER_, 'Unknown layer config type: ' + layerType);
    return null;
  }

  layer = layerConfig.createLayer(options);
  if (!layer) {
    goog.log.error(os.layer.LOGGER_, 'Failed creating layer of type: ' + layerType);
    return null;
  }

  layer = /** @type {os.layer.ILayer} */ (layer);
  layer.setLayerOptions(options);

  return layer;
};


/**
 * Identifies a layer by flashing it on and off.
 * @param {os.layer.ILayer} layer
 */
os.layer.identifyLayer = function(layer) {
  var tickCount = 0;
  var oldOpacity = layer.getOpacity() || 0;
  var oldVisibility = layer.getBaseVisible();
  var opacityTimer = new goog.Timer(250);
  var toggleOpacity = function() {
    if (tickCount > 5) {
      layer.setBaseVisible(oldVisibility);
      layer.setOpacity(oldOpacity);
      opacityTimer.dispose();
    } else {
      var newOpacity = tickCount % 2 ? 1 : 0;
      if (newOpacity == 1) {
        layer.setBaseVisible(true);
      } else {
        layer.setBaseVisible(false);
      }
      layer.setOpacity(newOpacity);
      tickCount++;
    }
  };

  opacityTimer.listen(goog.Timer.TICK, toggleOpacity);
  opacityTimer.start();
};


/**
 * Get the layer title from an id.
 * @param {string} layerId The layer id.
 * @param {boolean=} opt_explicit If the explicit title should be included.
 * @return {string}
 */
os.layer.getTitle = function(layerId, opt_explicit) {
  var title = '';

  // no layer name specified, so try to assemble one to provide context
  var layer = os.MapContainer.getInstance().getLayer(layerId);
  if (os.implements(layer, os.layer.ILayer.ID)) {
    layer = /** @type {os.layer.ILayer} */ (layer);

    title = layer.getTitle();
    if (title && opt_explicit) {
      var explicitType = layer.getExplicitType();
      if (explicitType) {
        title += ' ' + explicitType;
      }
    }
  }

  return title;
};


/**
 * Get a unique layer title. Adds an incrementing counter until a unique title is found.
 * @param {string} baseTitle The base layer title
 * @return {string}
 */
os.layer.getUniqueTitle = function(baseTitle) {
  baseTitle = baseTitle.replace(/\s+\[\d+]$/, '');
  var title = baseTitle;
  var next = 1;
  while (os.layer.hasLayer(title)) {
    title = baseTitle + ' [' + next++ + ']';
  }

  return title;
};


/**
 * Check if a layer exists by title.
 * @param {string} title The layer title
 * @return {boolean}
 */
os.layer.hasLayer = function(title) {
  var layers = os.MapContainer.getInstance().getLayers();
  return layers.some(function(layer) {
    try {
      // catch errors in case a base OL3 layer is added
      return /** @type {os.layer.ILayer} */ (layer).getTitle() == title;
    } catch (e) {}

    return false;
  });
};


/**
 * Get the brightness of the provided layer.
 * @param {os.layer.ILayer} layer
 * @return {number|undefined} The brightness
 */
os.layer.getBrightness = function(layer) {
  return layer.getBrightness();
};


/**
 * Get the contrast of the provided layer.
 * @param {os.layer.ILayer} layer
 * @return {number|undefined} The contrast
 */
os.layer.getContrast = function(layer) {
  return layer.getContrast();
};


/**
 * Get the hue of the provided layer.
 * @param {os.layer.ILayer} layer
 * @return {number|undefined} The hue
 */
os.layer.getHue = function(layer) {
  return layer.getHue();
};


/**
 * Get the opacity of the provided layer.
 * @param {os.layer.ILayer} layer
 * @return {number|undefined} The opacity
 */
os.layer.getOpacity = function(layer) {
  return layer.getOpacity();
};


/**
 * Get the saturation of the provided layer.
 * @param {os.layer.ILayer} layer
 * @return {number|undefined} The saturation
 */
os.layer.getSaturation = function(layer) {
  return layer.getSaturation();
};


/**
 * Set the brightness of the provided layer.
 * @param {os.layer.ILayer} layer
 * @param {number} value
 */
os.layer.setBrightness = function(layer, value) {
  layer.setBrightness(value);
};


/**
 * Set the contrast of the provided layer.
 * @param {os.layer.ILayer} layer
 * @param {number} value
 */
os.layer.setContrast = function(layer, value) {
  layer.setContrast(value);
};


/**
 * Set the hue of the provided layer.
 * @param {os.layer.ILayer} layer
 * @param {number} value
 */
os.layer.setHue = function(layer, value) {
  layer.setHue(value);
};


/**
 * Set the opacity of the provided layer.
 * @param {os.layer.ILayer} layer
 * @param {number} value
 */
os.layer.setOpacity = function(layer, value) {
  layer.setOpacity(value);
};


/**
 * Set the saturation of the provided layer.
 * @param {os.layer.ILayer} layer
 * @param {number} value
 */
os.layer.setSaturation = function(layer, value) {
  layer.setSaturation(value);
};


/**
 * @param {os.layer.ILayer} layer
 * @param {number} i
 * @param {Array} arr
 * @return {string}
 */
os.layer.mapLayersToIds = function(layer, i, arr) {
  return layer.getId();
};

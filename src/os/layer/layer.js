goog.module('os.layer');
goog.module.declareLegacyNamespace();

const Timer = goog.require('goog.Timer');
const log = goog.require('goog.log');
const osImplements = goog.require('os.implements');
const ILayer = goog.require('os.layer.ILayer');
const {getMapContainer} = goog.require('os.map.instance');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');

const Logger = goog.requireType('goog.log.Logger');
const Layer = goog.requireType('ol.layer.Layer');


/**
 * Layer option keys.
 * @enum {string}
 */
const LayerOption = {
  SHOW_FORCE_COLOR: 'showForceColor'
};

/**
 * Logger for os.layer
 * @type {Logger}
 */
const logger = log.getLogger('os.layer');

/**
 * Creates a layer from an options object.
 *
 * @param {!Object<string, *>} options The layer options
 * @return {ILayer}
 */
const createFromOptions = function(options) {
  var layer;
  var layerType = /** @type {string} */ (options['type']);
  if (!layerType) {
    log.error(logger, 'Layer type missing!');
    return null;
  }

  var layerConfig = LayerConfigManager.getInstance().getLayerConfig(layerType);
  if (!layerConfig) {
    log.error(logger, 'Unknown layer config type: ' + layerType);
    return null;
  }

  layer = layerConfig.createLayer(options);
  if (!layer) {
    log.error(logger, 'Failed creating layer of type: ' + layerType);
    return null;
  }

  layer = /** @type {ILayer} */ (layer);
  layer.setLayerOptions(options);

  return layer;
};

/**
 * Identifies a layer by flashing it on and off.
 *
 * @param {ILayer} layer
 */
const identifyLayer = function(layer) {
  var tickCount = 0;
  var oldOpacity = layer.getOpacity() || 0;
  var oldVisibility = layer.getBaseVisible();
  var opacityTimer = new Timer(250);
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

  opacityTimer.listen(Timer.TICK, toggleOpacity);
  opacityTimer.start();
};

/**
 * Get the layer title from an id.
 *
 * @param {string} layerId The layer id.
 * @param {boolean=} opt_explicit If the explicit title should be included.
 * @return {string}
 */
const getTitle = function(layerId, opt_explicit) {
  var title = '';

  // no layer name specified, so try to assemble one to provide context
  var layer = getMapContainer().getLayer(layerId);
  if (osImplements(layer, ILayer.ID)) {
    layer = /** @type {ILayer} */ (layer);

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
 *
 * @param {string} baseTitle The base layer title
 * @return {string}
 */
const getUniqueTitle = function(baseTitle) {
  baseTitle = baseTitle.replace(/\s+\[\d+]$/, '');
  var title = baseTitle;
  var next = 1;
  while (hasLayer(title)) {
    title = baseTitle + ' [' + next++ + ']';
  }

  return title;
};

/**
 * Check if a layer exists by title.
 *
 * @param {string} title The layer title
 * @return {boolean}
 */
const hasLayer = function(title) {
  var layers = getMapContainer().getLayers();
  return layers.some(function(layer) {
    try {
      // catch errors in case a base OL3 layer is added
      return (
        /** @type {ILayer} */
        (layer).getTitle() == title
      );
    } catch (e) {}

    return false;
  });
};

/**
 * If a layer is shown on the map.
 * @param {Layer|ILayer} layer The layer.
 * @return {boolean} If the layer is shown.
 */
const isShown = function(layer) {
  if (osImplements(layer, ILayer.ID)) {
    return !(/** @type {ILayer} */ (layer).getHidden());
  }

  // Not an ILayer, consider the layer shown if it's defined.
  return layer != null;
};

/**
 * Get the brightness of the provided layer.
 *
 * @param {ILayer} layer
 * @return {number|undefined} The brightness
 */
const getBrightness = function(layer) {
  return layer.getBrightness();
};

/**
 * Get the contrast of the provided layer.
 *
 * @param {ILayer} layer
 * @return {number|undefined} The contrast
 */
const getContrast = function(layer) {
  return layer.getContrast();
};

/**
 * Get the hue of the provided layer.
 *
 * @param {ILayer} layer
 * @return {number|undefined} The hue
 */
const getHue = function(layer) {
  return layer.getHue();
};

/**
 * Get the opacity of the provided layer.
 *
 * @param {ILayer} layer
 * @return {number|undefined} The opacity
 */
const getOpacity = function(layer) {
  return layer.getOpacity();
};

/**
 * Get the saturation of the provided layer.
 *
 * @param {ILayer} layer
 * @return {number|undefined} The saturation
 */
const getSaturation = function(layer) {
  return layer.getSaturation();
};

/**
 * Get the sharpness of the provided layer.
 *
 * @param {ILayer} layer
 * @return {number|undefined} The sharpness
 */
const getSharpness = function(layer) {
  return layer.getSharpness();
};

/**
 * Set the brightness of the provided layer.
 *
 * @param {ILayer} layer
 * @param {number} value
 */
const setBrightness = function(layer, value) {
  layer.setBrightness(value);
};

/**
 * Set the contrast of the provided layer.
 *
 * @param {ILayer} layer
 * @param {number} value
 */
const setContrast = function(layer, value) {
  layer.setContrast(value);
};

/**
 * Set the hue of the provided layer.
 *
 * @param {ILayer} layer
 * @param {number} value
 */
const setHue = function(layer, value) {
  layer.setHue(value);
};

/**
 * Set the opacity of the provided layer.
 *
 * @param {ILayer} layer
 * @param {number} value
 */
const setOpacity = function(layer, value) {
  layer.setOpacity(value);
};

/**
 * Set the saturation of the provided layer.
 *
 * @param {ILayer} layer
 * @param {number} value
 */
const setSaturation = function(layer, value) {
  layer.setSaturation(value);
};

/**
 * Set the sharpness of the provided layer.
 *
 * @param {ILayer} layer
 * @param {number} value
 */
const setSharpness = function(layer, value) {
  layer.setSharpness(value);
};

/**
 * @param {ILayer} layer
 * @param {number} i
 * @param {Array} arr
 * @return {string}
 */
const mapLayersToIds = function(layer, i, arr) {
  return layer.getId();
};

exports = {
  LayerOption,
  createFromOptions,
  identifyLayer,
  getTitle,
  getUniqueTitle,
  hasLayer,
  isShown,
  getBrightness,
  getContrast,
  getHue,
  getOpacity,
  getSaturation,
  getSharpness,
  setBrightness,
  setContrast,
  setHue,
  setOpacity,
  setSaturation,
  setSharpness,
  mapLayersToIds
};

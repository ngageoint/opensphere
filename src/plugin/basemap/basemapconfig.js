goog.module('plugin.basemap.BaseMapConfig');

const asserts = goog.require('goog.asserts');
const googObject = goog.require('goog.object');
const AbstractLayerConfig = goog.require('os.layer.config.AbstractLayerConfig');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const BaseMap = goog.require('plugin.basemap.layer.BaseMap');


/**
 * Creates a tiled map layer. Map layers are typically opaque and belong under all data overlays.
 *
 * Note that this configuration forces the <code>layerClass</code> option to be {@link BaseMap}.
 *
 * @example <caption>Example map layer config</caption>
 * "example": {
 *   "type": "BaseMap",
 *
 *   // minZoom and maxZoom indicate the zoom level range in which this layer will be visible
 *   "minZoom": 3, // min value is 2
 *   "maxZoom": 13, // max value is 24
 *
 *   // these properties apply to all tile layers
 *   "crossOrigin": "none|anonymous|use-credentials", // or omit completely
 *   "title": "Example",
 *   "description": "This is an example map layer configuration.",
 *
 *   // the base type indicates which type of tiled layer you are adding
 *   "baseType": "WMS" // could also be XYZ or any value which has a registered layer config associated with it
 *
 *   ... The rest of the properties should configure that specific type
 * }
 *
 * @see {@link plugin.ogc.wms.WMSLayerConfig} for configuring WMS map layers
 * @see {@link plugin.xyz.XYZLayerConfig} for configuring XYZ map layers (also best for ArcGIS map layers)
 */
class BaseMapConfig extends AbstractLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  createLayer(options) {
    var clonedOptions = googObject.clone(options);
    clonedOptions['layerClass'] = BaseMap;

    var layerType = /** @type {string} */ (clonedOptions['baseType']);
    var layerConfig = LayerConfigManager.getInstance().getLayerConfig(layerType);
    asserts.assert(layerConfig !== undefined);

    return layerConfig.createLayer(clonedOptions);
  }
}

exports = BaseMapConfig;

goog.provide('plugin.basemap.BaseMapConfig');

goog.require('goog.asserts');
goog.require('goog.object');
goog.require('os.layer.config.AbstractLayerConfig');
goog.require('plugin.basemap.layer.BaseMap');



/**
 * Creates a tiled map layer. Map layers are typically opaque and belong under all data overlays.
 *
 * Note that this configuration forces the <code>tileClass</code> option to be {@link plugin.basemap.layer.BaseMap}.
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
 * @extends {os.layer.config.AbstractLayerConfig}
 * @see {@link plugin.ogc.wms.WMSLayerConfig} for configuring WMS map layers
 * @see {@link plugin.xyz.XYZLayerConfig} for configuring XYZ map layers (also best for ArcGIS map layers)
 * @constructor
 */
plugin.basemap.BaseMapConfig = function() {
  plugin.basemap.BaseMapConfig.base(this, 'constructor');
};
goog.inherits(plugin.basemap.BaseMapConfig, os.layer.config.AbstractLayerConfig);


/**
 * @inheritDoc
 */
plugin.basemap.BaseMapConfig.prototype.createLayer = function(options) {
  var clonedOptions = goog.object.clone(options);
  clonedOptions['tileClass'] = plugin.basemap.layer.BaseMap;

  var layerType = /** @type {string} */ (clonedOptions['baseType']);
  var layerConfig = os.layer.config.LayerConfigManager.getInstance().getLayerConfig(layerType);
  goog.asserts.assert(goog.isDef(layerConfig));

  return layerConfig.createLayer(clonedOptions);
};


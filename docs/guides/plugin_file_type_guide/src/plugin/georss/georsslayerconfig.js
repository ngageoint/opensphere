goog.provide('plugin.georss.GeoRSSLayerConfig');
goog.require('os.layer.config.AbstractDataSourceLayerConfig');
goog.require('os.ui.im.ImportManager');
goog.require('plugin.georss.GeoRSSParser');


/**
 * @extends {os.layer.config.AbstractDataSourceLayerConfig}
 * @constructor
 */
plugin.georss.GeoRSSLayerConfig = function() {
  plugin.georss.GeoRSSLayerConfig.base(this, 'constructor');
};
goog.inherits(plugin.georss.GeoRSSLayerConfig, os.layer.config.AbstractDataSourceLayerConfig);


/**
 * @inheritDoc
 */
plugin.georss.GeoRSSLayerConfig.prototype.getParser = function(options) {
  return new plugin.georss.GeoRSSParser();
};

goog.provide('plugin.georss.GeoRSSProvider');
goog.require('os.data.FileProvider');


/**
 * GeoRSS file provider
 * @extends {os.data.FileProvider}
 * @constructor
 */
plugin.georss.GeoRSSProvider = function() {
  plugin.georss.GeoRSSProvider.base(this, 'constructor');
};
goog.inherits(plugin.georss.GeoRSSProvider, os.data.FileProvider);
goog.addSingletonGetter(plugin.georss.GeoRSSProvider);


/**
 * @inheritDoc
 */
plugin.georss.GeoRSSProvider.prototype.configure = function(config) {
  plugin.georss.GeoRSSProvider.base(this, 'configure', config);
  this.setId(plugin.georss.ID);
  this.setLabel('GeoRSS Files');
};

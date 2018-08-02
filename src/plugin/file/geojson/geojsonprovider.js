goog.provide('plugin.file.geojson.GeoJSONProvider');
goog.require('os.data.FileProvider');



/**
 * GeoJSON file provider
 * @extends {os.data.FileProvider}
 * @constructor
 */
plugin.file.geojson.GeoJSONProvider = function() {
  plugin.file.geojson.GeoJSONProvider.base(this, 'constructor');
};
goog.inherits(plugin.file.geojson.GeoJSONProvider, os.data.FileProvider);
goog.addSingletonGetter(plugin.file.geojson.GeoJSONProvider);


/**
 * @inheritDoc
 */
plugin.file.geojson.GeoJSONProvider.prototype.configure = function(config) {
  plugin.file.geojson.GeoJSONProvider.base(this, 'configure', config);
  this.setId('geojson');
  this.setLabel('GeoJSON Files');
};

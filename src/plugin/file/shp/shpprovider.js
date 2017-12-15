goog.provide('plugin.file.shp.SHPProvider');
goog.require('os.data.FileProvider');



/**
 * SHP file provider
 * @extends {os.data.FileProvider}
 * @constructor
 */
plugin.file.shp.SHPProvider = function() {
  plugin.file.shp.SHPProvider.base(this, 'constructor');
};
goog.inherits(plugin.file.shp.SHPProvider, os.data.FileProvider);
goog.addSingletonGetter(plugin.file.shp.SHPProvider);


/**
 * @inheritDoc
 */
plugin.file.shp.SHPProvider.prototype.configure = function(config) {
  plugin.file.shp.SHPProvider.base(this, 'configure', config);
  this.setId('shp');
  this.setLabel('SHP Files');
};

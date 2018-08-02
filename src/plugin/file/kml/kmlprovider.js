goog.provide('plugin.file.kml.KMLProvider');
goog.require('os.data.FileProvider');



/**
 * KML file provider
 * @extends {os.data.FileProvider}
 * @constructor
 */
plugin.file.kml.KMLProvider = function() {
  plugin.file.kml.KMLProvider.base(this, 'constructor');
};
goog.inherits(plugin.file.kml.KMLProvider, os.data.FileProvider);
goog.addSingletonGetter(plugin.file.kml.KMLProvider);


/**
 * @inheritDoc
 */
plugin.file.kml.KMLProvider.prototype.configure = function(config) {
  plugin.file.kml.KMLProvider.base(this, 'configure', config);
  this.setId('kml');
  this.setLabel('KML Files');
};

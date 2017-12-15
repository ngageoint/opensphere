goog.provide('plugin.file.gpx.GPXProvider');
goog.require('os.data.FileProvider');



/**
 * GPX file provider
 * @extends {os.data.FileProvider}
 * @constructor
 */
plugin.file.gpx.GPXProvider = function() {
  plugin.file.gpx.GPXProvider.base(this, 'constructor');
};
goog.inherits(plugin.file.gpx.GPXProvider, os.data.FileProvider);
goog.addSingletonGetter(plugin.file.gpx.GPXProvider);


/**
 * @inheritDoc
 */
plugin.file.gpx.GPXProvider.prototype.configure = function(config) {
  plugin.file.gpx.GPXProvider.base(this, 'configure', config);
  this.setId('gpx');
  this.setLabel('GPX Files');
};

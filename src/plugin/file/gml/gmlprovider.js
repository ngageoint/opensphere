goog.provide('plugin.file.gml.GMLProvider');
goog.require('os.data.FileProvider');



/**
 * GML file provider
 * @extends {os.data.FileProvider}
 * @constructor
 */
plugin.file.gml.GMLProvider = function() {
  plugin.file.gml.GMLProvider.base(this, 'constructor');
};
goog.inherits(plugin.file.gml.GMLProvider, os.data.FileProvider);
goog.addSingletonGetter(plugin.file.gml.GMLProvider);


/**
 * @inheritDoc
 */
plugin.file.gml.GMLProvider.prototype.configure = function(config) {
  plugin.file.gml.GMLProvider.base(this, 'configure', config);
  this.setId('gml');
  this.setLabel('GML Files');
};

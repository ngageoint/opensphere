goog.provide('plugin.file.gml.GMLParser');

goog.require('os.map');
goog.require('os.ui.file.gml.GMLParser');
goog.require('plugin.file.gml.GMLMixin');



/**
 * @extends {os.ui.file.gml.GMLParser}
 * @constructor
 */
plugin.file.gml.GMLParser = function() {
  plugin.file.gml.GMLParser.base(this, 'constructor');
};
goog.inherits(plugin.file.gml.GMLParser, os.ui.file.gml.GMLParser);


/**
 * @inheritDoc
 */
plugin.file.gml.GMLParser.prototype.getProjection = function() {
  return /** @type {!ol.proj.Projection} */ (os.map.PROJECTION);
};

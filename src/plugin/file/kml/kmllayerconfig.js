goog.provide('plugin.file.kml.KMLLayerConfig');

goog.require('goog.net.XhrIo.ResponseType');
goog.require('goog.userAgent');
goog.require('os.data.DataManager');
goog.require('os.layer.config.AbstractDataSourceLayerConfig');
goog.require('os.net');
goog.require('plugin.file.kml.KMLImporter');
goog.require('plugin.file.kml.KMLLayer');
goog.require('plugin.file.kml.KMLParser');
goog.require('plugin.file.kml.KMLSource');



/**
 * @extends {os.layer.config.AbstractDataSourceLayerConfig.<plugin.file.kml.ui.KMLNode>}
 * @constructor
 */
plugin.file.kml.KMLLayerConfig = function() {
  plugin.file.kml.KMLLayerConfig.base(this, 'constructor');
};
goog.inherits(plugin.file.kml.KMLLayerConfig, os.layer.config.AbstractDataSourceLayerConfig);


/**
 * @inheritDoc
 */
plugin.file.kml.KMLLayerConfig.prototype.getImporter = function(options) {
  var importer = new plugin.file.kml.KMLImporter(/** @type {plugin.file.kml.KMLParser} */ (this.getParser(options)));
  importer.setTrustHTML(os.net.isTrustedUri(/** @type {string|undefined} */ (options['url'])));

  // select the mappings we want to perform autodetection
  importer.selectAutoMappings([os.im.mapping.AltMapping.ID, os.im.mapping.SemiMajorMapping.ID,
    os.im.mapping.SemiMinorMapping.ID]);

  return importer;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLLayerConfig.prototype.getLayer = function(source) {
  return new plugin.file.kml.KMLLayer({
    source: source
  });
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLLayerConfig.prototype.getParser = function(options) {
  return new plugin.file.kml.KMLParser(options);
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLLayerConfig.prototype.getRequest = function(options) {
  var request = plugin.file.kml.KMLLayerConfig.base(this, 'getRequest', options);

  // requesting a Document in the response was slightly faster in testing, but only works for KML (not KMZ). if we run
  // into related issues of parsing speed, we should try to determine the content type ahead of time and change this.
  if (!goog.userAgent.IE || goog.userAgent.isVersionOrHigher(10)) {
    request.setResponseType(goog.net.XhrIo.ResponseType.ARRAY_BUFFER);
  }

  return request;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLLayerConfig.prototype.getSource = function(options) {
  var source = new plugin.file.kml.KMLSource(undefined);
  source.setFile(options['parserConfig'] ? options['parserConfig']['file'] : null);
  return source;
};

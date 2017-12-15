goog.provide('plugin.file.gpx.GPXLayerConfig');
goog.require('goog.net.XhrIo.ResponseType');
goog.require('goog.userAgent');
goog.require('os.layer.config.AbstractDataSourceLayerConfig');
goog.require('os.source.Request');
goog.require('plugin.file.gpx.GPXParser');



/**
 * @extends {os.layer.config.AbstractDataSourceLayerConfig}
 * @constructor
 */
plugin.file.gpx.GPXLayerConfig = function() {
  plugin.file.gpx.GPXLayerConfig.base(this, 'constructor');
};
goog.inherits(plugin.file.gpx.GPXLayerConfig, os.layer.config.AbstractDataSourceLayerConfig);


/**
 * @inheritDoc
 */
plugin.file.gpx.GPXLayerConfig.prototype.getParser = function(options) {
  return new plugin.file.gpx.GPXParser(options);
};


/**
 * @inheritDoc
 */
plugin.file.gpx.GPXLayerConfig.prototype.getRequest = function(options) {
  var request = plugin.file.gpx.GPXLayerConfig.base(this, 'getRequest', options);

  // instruct the handler to return a Document in the response, so the parsing is done in the request handler (where
  // supported) instead of the importer. this was slightly faster in testing. IE9 doesn't support this.
  if (!goog.userAgent.IE || goog.userAgent.isVersionOrHigher(10)) {
    request.setResponseType(goog.net.XhrIo.ResponseType.DOCUMENT);
  }

  return request;
};


/**
 * @inheritDoc
 */
plugin.file.gpx.GPXLayerConfig.prototype.getImporter = function(options) {
  var importer = plugin.file.gpx.GPXLayerConfig.base(this, 'getImporter', options);
  // enable autodetection using the default set of mappings (i.e. all of them)
  importer.setAutoDetect(true);
  return importer;
};


/**
 * Up the default column autodetect limit for GPX source.
 * @inheritDoc
 */
plugin.file.gpx.GPXLayerConfig.prototype.getSource = function(options) {
  var source = new os.source.Request();
  source.setColumnAutoDetectLimit(100);
  return source;
};

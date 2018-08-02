goog.provide('plugin.file.shp.SHPLayerConfig');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.layer.config.AbstractDataSourceLayerConfig');
goog.require('os.source.MultiRequest');
goog.require('os.source.Request');
goog.require('plugin.file.shp.SHPParser');
goog.require('plugin.file.shp.SHPParserConfig');



/**
 * @extends {os.layer.config.AbstractDataSourceLayerConfig}
 * @constructor
 */
plugin.file.shp.SHPLayerConfig = function() {
  plugin.file.shp.SHPLayerConfig.base(this, 'constructor');
  this.log = plugin.file.shp.SHPLayerConfig.LOGGER_;

  /**
   * @type {plugin.file.shp.SHPParserConfig}
   * @protected
   */
  this.parserConfig = null;
};
goog.inherits(plugin.file.shp.SHPLayerConfig, os.layer.config.AbstractDataSourceLayerConfig);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.file.shp.SHPLayerConfig.LOGGER_ = goog.log.getLogger('plugin.file.shp.SHPLayerConfig');


/**
 * @inheritDoc
 */
plugin.file.shp.SHPLayerConfig.prototype.initializeConfig = function(options) {
  plugin.file.shp.SHPLayerConfig.superClass_.initializeConfig.call(this, options);

  this.parserConfig = options['parserConfig'] || new plugin.file.shp.SHPParserConfig();
};


/**
 * @inheritDoc
 */
plugin.file.shp.SHPLayerConfig.prototype.createLayer = function(options) {
  this.initializeConfig(options);

  if (!options['url']) {
    goog.log.error(this.log, 'Unable to create SHP layer without a source URL!');
    return null;
  }

  var source = null;
  if (options['url2']) {
    source = new os.source.MultiRequest(undefined);
    source.setRequests(this.getRequests(options));
  } else {
    this.url = /** @type {string} */ (options['url']);
    source = new os.source.Request(undefined);
    source.setRequest(this.getRequest(options));
  }

  source.setId(this.id);
  source.setImporter(this.getImporter(options));
  source.setTitle(this.title);
  source.setTimeEnabled(this.animate);

  var layer = this.getLayer(source, options);
  if (options) {
    layer.restore(options);
  }

  if (options['load']) {
    source.refresh();
  }

  return layer;
};


/**
 * @inheritDoc
 */
plugin.file.shp.SHPLayerConfig.prototype.getImporter = function(options) {
  var importer = plugin.file.shp.SHPLayerConfig.base(this, 'getImporter', options);
  importer.setAutoMappings(this.parserConfig['mappings']);
  return importer;
};


/**
 * @inheritDoc
 */
plugin.file.shp.SHPLayerConfig.prototype.getParser = function(options) {
  var config = this.parserConfig || new plugin.file.shp.SHPParserConfig();

  if (goog.isDef(options['lineAlpha'])) {
    config['lineAlpha'] = options['lineAlpha'];
  }
  if (goog.isDef(options['fillAlpha'])) {
    config['fillAlpha'] = options['fillAlpha'];
  }
  if (goog.isDef(options['append'])) {
    config['append'] = options['append'];
  }

  return new plugin.file.shp.SHPParser(config);
};


/**
 * @inheritDoc
 */
plugin.file.shp.SHPLayerConfig.prototype.getRequest = function(options) {
  var request = plugin.file.shp.SHPLayerConfig.base(this, 'getRequest', options);

  // IE9 doesn't support arraybuffer as a response type
  if (!goog.userAgent.IE || goog.userAgent.isVersionOrHigher(10)) {
    request.setResponseType(goog.net.XhrIo.ResponseType.ARRAY_BUFFER);
  }

  return request;
};


/**
 * Assembles an array of requests for the SHP/DBF files.
 * @param {Object.<string, *>} options Layer configuration options.
 * @return {!Array.<!os.net.Request>}
 */
plugin.file.shp.SHPLayerConfig.prototype.getRequests = function(options) {
  var requests = [];

  // request for SHP file
  this.url = /** @type {string} */ (options['url']);
  requests.push(this.getRequest(options));

  // request for DBF file
  this.url = /** @type {string} */ (options['url2']);
  requests.push(this.getRequest(options));

  return requests;
};

goog.module('plugin.file.shp.SHPLayerConfig');
goog.module.declareLegacyNamespace();

const log = goog.require('goog.log');
const ResponseType = goog.require('goog.net.XhrIo.ResponseType');
const userAgent = goog.require('goog.userAgent');
const AbstractDataSourceLayerConfig = goog.require('os.layer.config.AbstractDataSourceLayerConfig');
const MultiRequest = goog.require('os.source.MultiRequest');
const RequestSource = goog.require('os.source.Request');
const SHPParser = goog.require('plugin.file.shp.SHPParser');
const SHPParserConfig = goog.require('plugin.file.shp.SHPParserConfig');

const Logger = goog.requireType('goog.log.Logger');


/**
 */
class SHPLayerConfig extends AbstractDataSourceLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = logger;

    /**
     * @type {SHPParserConfig}
     * @protected
     */
    this.parserConfig = null;
  }

  /**
   * @inheritDoc
   */
  initializeConfig(options) {
    super.initializeConfig(options);

    this.parserConfig = options['parserConfig'] || new SHPParserConfig();
  }

  /**
   * @inheritDoc
   */
  createLayer(options) {
    this.initializeConfig(options);

    if (!options['url']) {
      log.error(this.log, 'Unable to create SHP layer without a source URL!');
      return null;
    }

    var source = null;
    if (options['url2']) {
      source = new MultiRequest(undefined);
      source.setRequests(this.getRequests(options));
    } else {
      this.url = /** @type {string} */ (options['url']);
      source = new RequestSource(undefined);
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
  }

  /**
   * @inheritDoc
   */
  getImporter(options) {
    var importer = super.getImporter(options);

    // setAutoMappings() ignores manual configs (e.g. custom Datetime format) since it re-autodetects
    importer.setExecMappings(this.parserConfig['mappings']);

    return importer;
  }

  /**
   * @inheritDoc
   */
  getParser(options) {
    var config = this.parserConfig || new SHPParserConfig();

    if (options['lineAlpha'] !== undefined) {
      config['lineAlpha'] = options['lineAlpha'];
    }
    if (options['fillAlpha'] !== undefined) {
      config['fillAlpha'] = options['fillAlpha'];
    }
    if (options['append'] !== undefined) {
      config['append'] = options['append'];
    }

    return new SHPParser(config);
  }

  /**
   * @inheritDoc
   */
  getRequest(options) {
    var request = super.getRequest(options);

    // IE9 doesn't support arraybuffer as a response type
    if (!userAgent.IE || userAgent.isVersionOrHigher(10)) {
      request.setResponseType(ResponseType.ARRAY_BUFFER);
    }

    return request;
  }

  /**
   * Assembles an array of requests for the SHP/DBF files.
   *
   * @param {Object.<string, *>} options Layer configuration options.
   * @return {!Array.<!os.net.Request>}
   */
  getRequests(options) {
    var requests = [];

    // request for SHP file
    this.url = /** @type {string} */ (options['url']);
    requests.push(this.getRequest(options));

    // request for DBF file
    this.url = /** @type {string} */ (options['url2']);
    requests.push(this.getRequest(options));

    return requests;
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('plugin.file.shp.SHPLayerConfig');


exports = SHPLayerConfig;

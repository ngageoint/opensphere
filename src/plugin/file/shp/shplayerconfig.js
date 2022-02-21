goog.declareModuleId('plugin.file.shp.SHPLayerConfig');

import AbstractDataSourceLayerConfig from '../../../os/layer/config/abstractdatasourcelayerconfig.js';
import MultiRequest from '../../../os/source/multirequestsource.js';
import RequestSource from '../../../os/source/requestsource.js';
import SHPParser from './shpparser.js';
import SHPParserConfig from './shpparserconfig.js';

const log = goog.require('goog.log');
const ResponseType = goog.require('goog.net.XhrIo.ResponseType');
const userAgent = goog.require('goog.userAgent');


/**
 */
export default class SHPLayerConfig extends AbstractDataSourceLayerConfig {
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
    const importer = /** @type {FeatureImporter} */ (super.getImporter(options));

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
   * @param {Object<string, *>} options Layer configuration options.
   * @return {!Array<!Request>}
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

goog.declareModuleId('plugin.file.gpx.GPXLayerConfig');

import AbstractDataSourceLayerConfig from '../../../os/layer/config/abstractdatasourcelayerconfig.js';
import RequestSource from '../../../os/source/requestsource.js';
import GPXParser from './gpxparser.js';

const ResponseType = goog.require('goog.net.XhrIo.ResponseType');
const userAgent = goog.require('goog.userAgent');

/**
 */
export default class GPXLayerConfig extends AbstractDataSourceLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  getParser(options) {
    return new GPXParser(options);
  }

  /**
   * @inheritDoc
   */
  getRequest(options) {
    var request = super.getRequest(options);

    // instruct the handler to return a Document in the response, so the parsing is done in the request handler (where
    // supported) instead of the importer. this was slightly faster in testing. IE9 doesn't support this.
    if (!userAgent.IE || userAgent.isVersionOrHigher(10)) {
      request.setResponseType(ResponseType.DOCUMENT);
    }

    return request;
  }

  /**
   * @inheritDoc
   */
  getImporter(options) {
    const importer = /** @type {FeatureImporter} */ (super.getImporter(options));
    // enable autodetection using the default set of mappings (i.e. all of them)
    importer.setAutoDetect(true);
    return importer;
  }

  /**
   * Up the default column autodetect limit for GPX source.
   *
   * @inheritDoc
   */
  getSource(options) {
    var source = new RequestSource();
    source.setColumnAutoDetectLimit(100);
    return source;
  }
}

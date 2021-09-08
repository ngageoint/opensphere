goog.module('plugin.file.gpx.GPXLayerConfig');

const ResponseType = goog.require('goog.net.XhrIo.ResponseType');
const userAgent = goog.require('goog.userAgent');
const AbstractDataSourceLayerConfig = goog.require('os.layer.config.AbstractDataSourceLayerConfig');
const RequestSource = goog.require('os.source.Request');
const GPXParser = goog.require('plugin.file.gpx.GPXParser');

const FeatureImporter = goog.requireType('os.im.FeatureImporter');


/**
 */
class GPXLayerConfig extends AbstractDataSourceLayerConfig {
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

exports = GPXLayerConfig;

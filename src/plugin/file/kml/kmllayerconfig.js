goog.declareModuleId('plugin.file.kml.KMLLayerConfig');

import AltMapping from '../../../os/im/mapping/altmapping.js';
import OrientationMapping from '../../../os/im/mapping/orientationmapping.js';
import SemiMajorMapping from '../../../os/im/mapping/semimajormapping.js';
import SemiMinorMapping from '../../../os/im/mapping/semiminormapping.js';
import AbstractDataSourceLayerConfig from '../../../os/layer/config/abstractdatasourcelayerconfig.js';
import * as net from '../../../os/net/net.js';
import KMLImporter from './kmlimporter.js';
import KMLLayer from './kmllayer.js';
import KMLParser from './kmlparser.js';
import KMLSource from './kmlsource.js';

const ResponseType = goog.require('goog.net.XhrIo.ResponseType');
const userAgent = goog.require('goog.userAgent');


/**
 * @extends {AbstractDataSourceLayerConfig.<plugin.file.kml.ui.KMLNode>}
 */
export default class KMLLayerConfig extends AbstractDataSourceLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  getImporter(options) {
    var importer = new KMLImporter(/** @type {KMLParser} */ (this.getParser(options)));
    importer.setTrustHTML(net.isTrustedUri(/** @type {string|undefined} */ (options['url'])));

    // select the mappings we want to perform autodetection
    importer.selectAutoMappings([
      AltMapping.ID,
      OrientationMapping.ID,
      SemiMajorMapping.ID,
      SemiMinorMapping.ID]);

    return importer;
  }

  /**
   * @inheritDoc
   */
  getLayer(source) {
    return new KMLLayer({
      source: source
    });
  }

  /**
   * @inheritDoc
   */
  getParser(options) {
    return new KMLParser(options);
  }

  /**
   * @inheritDoc
   */
  getRequest(options) {
    var request = super.getRequest(options);

    // requesting a Document in the response was slightly faster in testing, but only works for KML (not KMZ). if we run
    // into related issues of parsing speed, we should try to determine the content type ahead of time and change this.
    if (!userAgent.IE || userAgent.isVersionOrHigher(10)) {
      request.setResponseType(ResponseType.ARRAY_BUFFER);
    }

    return request;
  }

  /**
   * @inheritDoc
   */
  getSource(options) {
    var source = new KMLSource(undefined);
    source.setFile(options['parserConfig'] ? options['parserConfig']['file'] : null);
    return source;
  }
}

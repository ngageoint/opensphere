goog.declareModuleId('plugin.file.kml.KMLFeatureParser');

import {isDocument, parse} from 'ol/src/xml.js';
import * as text from '../../../os/file/mime/text.js';
import * as osMap from '../../../os/map/map.js';
import KML from '../../../os/ol/format/KML.js';


/**
 * Simple KML parser that extracts features from a KML.
 *
 * @implements {IParser<ol.Feature>}
 */
export default class KMLFeatureParser {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {KML}
     * @private
     */
    this.format_ = new KML({
      showPointNames: false
    });

    /**
     * @type {?Document}
     * @private
     */
    this.document_ = null;
  }

  /**
   * @inheritDoc
   */
  setSource(source) {
    if (source instanceof ArrayBuffer) {
      source = text.getText(source) || null;
    }

    if (isDocument(source)) {
      this.document_ = /** @type {Document} */ (source);
    } else if (typeof source === 'string') {
      this.document_ = parse(source);
    }
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    this.document_ = null;
  }

  /**
   * @inheritDoc
   */
  hasNext() {
    return this.document_ != null;
  }

  /**
   * @inheritDoc
   */
  parseNext() {
    var features = null;
    if (this.document_) {
      // make sure the document reference is cleared so errors don't result in hasNext continuing to return true. the
      // importer will catch and report the error so we don't do it here.
      var doc = this.document_;
      this.document_ = null;

      features = this.format_.readFeatures(doc, {
        featureProjection: osMap.PROJECTION
      });
    }

    return features;
  }
}

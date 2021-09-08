goog.module('plugin.file.kml.KMLFeatureParser');

const KML = goog.require('ol.format.KML');
const xml = goog.require('ol.xml');
const text = goog.require('os.file.mime.text');
const osMap = goog.require('os.map');
const IParser = goog.requireType('os.parse.IParser');


/**
 * Simple KML parser that extracts features from a KML.
 *
 * @implements {IParser<ol.Feature>}
 */
class KMLFeatureParser {
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

    if (xml.isDocument(source)) {
      this.document_ = /** @type {Document} */ (source);
    } else if (typeof source === 'string') {
      this.document_ = xml.parse(source);
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

exports = KMLFeatureParser;

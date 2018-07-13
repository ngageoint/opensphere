goog.provide('plugin.file.kml.KMLFeatureParser');

goog.require('ol.format.KML');
goog.require('ol.xml');
goog.require('os.file.mime.text');
goog.require('os.parse.IParser');



/**
 * Simple KML parser that extracts features from a KML.
 * @implements {os.parse.IParser<ol.Feature>}
 * @constructor
 */
plugin.file.kml.KMLFeatureParser = function() {
  /**
   * @type {ol.format.KML}
   * @private
   */
  this.format_ = new ol.format.KML({
    showPointNames: false
  });

  /**
   * @type {?Document}
   * @private
   */
  this.document_ = null;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLFeatureParser.prototype.setSource = function(source) {
  if (source instanceof ArrayBuffer) {
    source = os.file.mime.text.getText(source) || null;
  }

  if (ol.xml.isDocument(source)) {
    this.document_ = /** @type {Document} */ (source);
  } else if (goog.isString(source)) {
    this.document_ = ol.xml.parse(source);
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLFeatureParser.prototype.cleanup = function() {
  this.document_ = null;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLFeatureParser.prototype.hasNext = function() {
  return goog.isDefAndNotNull(this.document_);
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLFeatureParser.prototype.parseNext = function() {
  var features = null;
  if (this.document_) {
    // make sure the document reference is cleared so errors don't result in hasNext continuing to return true. the
    // importer will catch and report the error so we don't do it here.
    var doc = this.document_;
    this.document_ = null;

    features = this.format_.readFeatures(doc);
  }

  return features;
};

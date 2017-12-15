goog.provide('plugin.area.KMLAreaParser');
goog.require('ol.format.KML');
goog.require('ol.xml');
goog.require('os.data.ColumnDefinition');
goog.require('os.parse.AsyncParser');
goog.require('os.parse.IParser');



/**
 * Simple KML parser that extracts areas from a KML. Has asynchronous support for KMZ files.
 * @implements {os.parse.IParser.<ol.Feature>}
 * @extends {os.parse.AsyncParser}
 * @template T
 * @constructor
 */
plugin.area.KMLAreaParser = function() {
  plugin.area.KMLAreaParser.base(this, 'constructor');

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

  /**
   * @type {Object<string, !zip.Entry>} entries
   * @private
   */
  this.kmlEntries_ = {};

  /**
   * @type {Array<os.data.ColumnDefinition>}
   * @protected
   */
  this.columns = null;

  /**
   * @type {goog.log.Logger}
   * @private
   */
  this.log_ = plugin.area.KMLAreaParser.LOGGER_;
};
goog.inherits(plugin.area.KMLAreaParser, os.parse.AsyncParser);


/**
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.area.KMLAreaParser.LOGGER_ = goog.log.getLogger('plugin.area.KMLAreaParser');


/**
 * @inheritDoc
 */
plugin.area.KMLAreaParser.prototype.setSource = function(source) {
  this.cleanup();

  if (ol.xml.isDocument(source)) {
    this.document_ = /** @type {Document} */ (source);
  } else if (goog.isString(source)) {
    this.document_ = goog.dom.xml.loadXml(source);
  } else if (source instanceof ArrayBuffer) {
    if (os.file.isZipFile(source)) {
      this.handleZIP_(source);
      return;
    } else {
      this.document_ = goog.dom.xml.loadXml(os.arraybuf.toString(source));
    }
  } else if (source instanceof Blob) {
    goog.fs.FileReader.readAsArrayBuffer(source).addCallback(this.setSource, this);
    return;
  }

  if (this.document_) {
    var rootEl = goog.dom.getFirstElementChild(this.document_);
    if (rootEl && rootEl.localName.toLowerCase() !== 'kml') {
      // Sometimes people are dumb and create documents without a root <kml> tag.
      // This is technically invalid KML and even invalid XML.  Because Google Earth
      // accepts this crap, add a special case to put the proper root tag.
      var newRoot = os.xml.createElement('kml', this.document_);
      newRoot.appendChild(rootEl);
      this.document_.appendChild(newRoot);
      rootEl = newRoot;
    }

    if (rootEl) {
      this.onReady();
    } else {
      goog.log.error(this.log_, 'No KML content to parse!');
      this.onError();
    }
  } else {
    goog.log.error(this.log_, 'Content must be a valid KML document!');
    this.onError();
  }
};


/**
 * @param {ArrayBuffer} source
 * @private
 */
plugin.area.KMLAreaParser.prototype.handleZIP_ = function(source) {
  zip.createReader(new zip.ArrayBufferReader(source), goog.bind(function(reader) {
    reader.getEntries(this.processZIPEntries_.bind(this));
  }, this), goog.bind(function() {
    this.onError();
    goog.log.error(this.log_, 'Error reading zip file!');
  }, this));
};


/**
 * HACK ALERT! zip.js has a zip.TextWriter() class that directly turns the zip entry into the string we want.
 * Unfortunately, it doesn't work in FF24 for some reason, but luckily, the BlobWriter does. Here, we read
 * the zip as a Blob, then feed it to a FileReader in the next callback in order to extract the text.
 * @param {Array.<!zip.Entry>} entries
 * @private
 */
plugin.area.KMLAreaParser.prototype.processZIPEntries_ = function(entries) {
  var mainEntry = null;
  var firstEntry = null;
  var mainKml = /(doc|index)\.kml$/i;
  var anyKml = /\.kml$/i;

  for (var i = 0, n = entries.length; i < n; i++) {
    // if we have multiple entries, try to find one titled either doc.kml or index.kml as these
    // are generally the most important ones
    var entry = entries[i];
    if (!mainEntry && mainKml.test(entry.filename)) {
      mainEntry = entry;
    } else if (anyKml.test(entry.filename)) {
      if (!firstEntry) {
        firstEntry = entry;
      }

      this.kmlEntries_[entry.filename] = entry;
    }
  }

  mainEntry = mainEntry || firstEntry;

  if (mainEntry) {
    this.processMainEntry_(mainEntry);
  } else {
    goog.log.error(this.log_, 'No KML found in the ZIP!');
    this.onError();
  }
};


/**
 * Parse the main kml file
 * @param {zip.Entry} mainEntry
 * @private
 */
plugin.area.KMLAreaParser.prototype.processMainEntry_ = function(mainEntry) {
  mainEntry.getData(new zip.BlobWriter(), this.processZIPEntry_.bind(this, mainEntry.filename));
};


/**
 * Unzips the main entry.
 * @param {string} filename
 * @param {*} content
 * @private
 */
plugin.area.KMLAreaParser.prototype.processZIPEntry_ = function(filename, content) {
  if (content && content instanceof Blob) {
    var reader = new FileReader();
    reader.onload = this.handleZIPText_.bind(this, filename);
    reader.readAsText(content);
  } else {
    goog.log.error(this.log_, 'There was a problem unzipping the KMZ!');
    this.onError();
  }
};


/**
 * @param {string} filename
 * @param {Event} event
 * @private
 */
plugin.area.KMLAreaParser.prototype.handleZIPText_ = function(filename, event) {
  var content = event.target.result;

  if (content && goog.isString(content)) {
    if (!this.document_) {
      this.setSource(content);
    }
  } else {
    goog.log.error(this.log_, 'There was a problem reading the ZIP content!');
    this.onError();
  }
};


/**
 * @inheritDoc
 */
plugin.area.KMLAreaParser.prototype.cleanup = function() {
  this.document_ = null;
};


/**
 * @inheritDoc
 */
plugin.area.KMLAreaParser.prototype.hasNext = function() {
  return goog.isDefAndNotNull(this.document_);
};


/**
 * @inheritDoc
 */
plugin.area.KMLAreaParser.prototype.parseNext = function() {
  var features = null;
  if (this.document_) {
    // make sure the document reference is cleared so errors don't result in hasNext continuing to return true. the
    // importer will catch and report the error so we don't do it here.
    var doc = this.document_;
    this.document_ = null;
    features = this.format_.readFeatures(doc, {
      featureProjection: os.map.PROJECTION
    });
  }

  if (features) {
    this.columns = [];
    var columnMap = {};
    features.forEach(function(feature) {
      var values = feature.getProperties();
      if (values) {
        for (var key in values) {
          columnMap[key] = true;
        }
      }
    });

    for (var key in columnMap) {
      var definition = new os.data.ColumnDefinition(key);
      this.columns.push(definition);
    }
  }

  return features;
};


/**
 * Get the columns.
 * @return {?Array<os.data.ColumnDefinition>} The definitions
 */
plugin.area.KMLAreaParser.prototype.getColumns = function() {
  return this.columns;
};

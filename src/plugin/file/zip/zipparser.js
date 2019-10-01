goog.provide('plugin.file.zip.ZIPParser');

goog.require('goog.Disposable');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.string');
goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiLineString');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('os.data.ColumnDefinition');
goog.require('os.file');
goog.require('os.file.mime.text');
goog.require('os.file.mime.zip');
goog.require('os.geo');
goog.require('os.parse.AsyncZipParser');
goog.require('plugin.file.zip');


/**
 * A ZIP file parser
 *
 * @param {plugin.file.zip.ZIPParserConfig} config
 * @extends {os.parse.AsyncZipParser<ol.Feature>}
 * @constructor
 */
plugin.file.zip.ZIPParser = function(config) {
  plugin.file.zip.ZIPParser.base(this, 'constructor');

  /**
   * @type {Array.<Object>}
   * @private
   */
  this.files_ = [];

  /**
   * @type {boolean}
   * @private
   */
  this.initialized_ = false;

  /**
   * @type {Array.<ArrayBuffer>}
   * @private
   */
  this.source_ = [];

  /**
   * @type {function}
   * @public
   */
  this.unzipCallback = null;

};
goog.inherits(plugin.file.zip.ZIPParser, os.parse.AsyncZipParser);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.file.zip.ZIPParser.LOGGER_ = goog.log.getLogger('plugin.file.zip.ZIPParser');


/**
 * @inheritDoc
 */
plugin.file.zip.ZIPParser.prototype.cleanup = function() {
  this.initialized_ = false;
};


/**
 * @inheritDoc
 */
plugin.file.zip.ZIPParser.prototype.disposeInternal = function() {
  plugin.file.zip.ZIPParser.base(this, 'disposeInternal');
  this.cleanup();
  this.source_.length = 0;
};


/**
 * @return {Array.<Object>}
 */
plugin.file.zip.ZIPParser.prototype.getFiles = function() {
  return this.files_;
};


/**
 * @inheritDoc
 */
plugin.file.zip.ZIPParser.prototype.hasNext = function() {
  return this.initialized_;
};


/**
 * @inheritDoc
 */
plugin.file.zip.ZIPParser.prototype.parseNext = function() {
  var file = null;

  if (file) {
    file.setId(String(ol.getUid(file)));
  }

  if (!this.hasNext()) {
    this.closeZipReaders();
  }

  return file;
};


/**
 * @inheritDoc
 */
plugin.file.zip.ZIPParser.prototype.setSource = function(source) {
  // reset necessary values
  this.initialized_ = false;
  this.processingZip_ = false;
  this.source_.length = 0;

  if (!source) {
    return;
  }

  if (goog.isArray(source)) {
    var i = source.length;
    while (i--) {
      if (source[i] instanceof ArrayBuffer) {
        this.source_.push(/** @type {ArrayBuffer} */ (source[i]));
      } else {
        this.logError_('Invalid ZIP source!');
      }
    }
  } else if (source instanceof ArrayBuffer) {
    this.source_.push(/** @type {ArrayBuffer} */ (source));
  } else {
    this.logError_('Invalid ZIP source!');
  }

  if (this.source_.length > 0) {
    this.initialize_();
  }
};


/**
 * Configures the parser using the provided file(s).
 *
 * @private
 */
plugin.file.zip.ZIPParser.prototype.initialize_ = function() {
  var i = this.source_.length;
  while (i--) {
    var source = this.source_[i];
    if (os.file.mime.zip.isZip(source)) {
      this.createZipReader(source);
    }
  }
};


/**
 * @inheritDoc
 */
plugin.file.zip.ZIPParser.prototype.onError = function() {
  this.initialized_ = true;
  this.processingZip_ = false;
  plugin.file.zip.ZIPParser.base(this, 'onError');
};


/**
 * @inheritDoc
 */
plugin.file.zip.ZIPParser.prototype.onReady = function() {
  this.initialized_ = true;
  this.processingZip_ = false;
  plugin.file.zip.ZIPParser.base(this, 'onReady');
};


/**
 * @param {string} msg
 * @private
 */
plugin.file.zip.ZIPParser.prototype.logWarning_ = function(msg) {
  goog.log.warning(plugin.file.zip.ZIPParser.LOGGER_, msg);
};


/**
 * @param {string} msg
 * @private
 */
plugin.file.zip.ZIPParser.prototype.logError_ = function(msg) {
  goog.log.error(plugin.file.zip.ZIPParser.LOGGER_, msg);
};


/**
 * @inheritDoc
 */
plugin.file.zip.ZIPParser.prototype.createZipReader = function(source) {
  this.processingZip_ = true;
  plugin.file.zip.ZIPParser.base(this, 'createZipReader', source);
};


/**
 * @inheritDoc
 */
plugin.file.zip.ZIPParser.prototype.handleZipEntries = function(entries) {
  if (goog.isNull(entries) || entries.length == 0) {
    this.logWarning_('No file(s) found in ZIP!');
  } else {
    for (var i = 0, n = entries.length; i < n; i++) {
      var entry = entries[i];

      entry.isLast = (i == (n-1));

      // if the entry is a supported type, build an "entry" object and queue up the content import
      entry.getData(new zip.ArrayBufferWriter(), this.processZIPEntry_.bind(this, entry));

    }

  }
};


/**
 * @param {*} entry
 * @param {*} content
 * @private
 */
plugin.file.zip.ZIPParser.prototype.processZIPEntry_ = function(entry, content) {
  if (content && content instanceof ArrayBuffer) {
    var reader = new FileReader();
    reader.onload = this.handleZIPText_.bind(this, entry);
    reader.readAsText(new Blob([content]));
  } else {
    goog.log.error(this.log_, 'There was a problem unzipping the file!');
    this.onError(); 
  }
};


/**
 * @param {*} entry
 * @param {Event} event
 * @private
 */
plugin.file.zip.ZIPParser.prototype.handleZIPText_ = function(entry, event) {
  var content = event.target.result;

  if (content && typeof content === 'string') {
    var dst = this.toUIObject_(entry, content);
    if (!goog.isNull(dst)) this.files_.push(dst);

  } else {
    goog.log.error(this.log_, 'There was a problem reading the ZIP content!');
    this.onError();
  }

  if (entry.isLast) {
    this.dispatchEvent(new goog.events.Event(os.events.EventType.COMPLETE));
    this.processingZip_ = false;
  }
};


/**
 * @param {Object} src
 * @private
 */
plugin.file.zip.ZIPParser.prototype.toUIObject_ = function(src, content) {
  // TODO check import support for the file
  if (!src.filename) return;
  
  var file = new os.file.File();
        
  file.setContent(content);
  file.setContentType('application/csv');
  file.setFileName(src.filename);
  file.setUrl('local://'+src.filename);
  file.setType('application/csv');

  // turn this into a better object for the UI
  return {
    filename: src.filename,
    valid: true,
    selected: true,
    msg: '',
    src: src,
    file: file
  };
};
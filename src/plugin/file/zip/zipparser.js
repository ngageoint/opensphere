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
goog.require('os.file.mime');
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
  if (typeof entries == 'undefined' || entries === null || entries.length == 0) {
    this.logWarning_('No file(s) found in ZIP!');
  } else {
    for (var i = 0, n = entries.length; i < n; i++) {
      var entry = entries[i];

      entry.isLast = (i == (n - 1));

      // if the entry is a supported type, build an "entry" object and queue up the content import
      entry.getData(new zip.ArrayBufferWriter(), this.processZIPEntry_.bind(this, entry));
    }
  }
};


/**
 * @param {Object} entry
 * @param {*} content
 * @private
 */
plugin.file.zip.ZIPParser.prototype.processZIPEntry_ = function(entry, content) {
  if (content && content instanceof ArrayBuffer) {
    entry.content = content;
    var reader = new FileReader();
    reader.onload = this.handleZIPText_.bind(this, entry);
    reader.readAsText(new Blob([content]));
  } else {
    this.logError_('There was a problem unzipping the file!');
    this.onError();
  }
};


/**
 * @param {Object} entry
 * @param {Event} event
 * @private
 */
plugin.file.zip.ZIPParser.prototype.handleZIPText_ = function(entry, event) {
  var content = event.target.result;

  if (content && typeof content === 'string') {
    // TODO move this step up to the processZIPEntry -- so the mime.detect doesn't have to use a copy of "content"
    this.toFile_(
      entry, 
      content, 
      this.onComplete_
    );
  } else {
    this.logError_('There was a problem reading the ZIP content!');
    this.onError();
  }
};


/**
 * @param {Object} entry
 * @param {*} content
 * @param {function} callback
 * @private
 */
plugin.file.zip.ZIPParser.prototype.toFile_ = function(entry, content, callback) {
  // TODO check import support for the file
  if (!entry.filename) return null;

  var file = new os.file.File();
  file.setContent(String(content));
  file.setFileName(entry.filename);
  file.setUrl('local://' + entry.filename);
  
  var onComplete = function(type) {
    if (type) {
      var chain = os.file.mime.getTypeChain(type);
      if (chain && chain.indexOf(os.file.mime.text.TYPE) > -1) {
        file.convertContentToString();
      }

      file.setContentType(type);
      file.setType(type);
    }
    return type;
  };

  os.file.mime
    .detect(entry.content, file)
    .then(onComplete)
    .then(function(type) {
      delete entry['content']; //stop wasting space
      if (type) {
        // turn this into a better object for the UI
        this.files_.push({
          filename: entry.filename,
          valid: true,
          selected: true,
          msg: '',
          src: entry,
          file: file
        });
      }
      return entry;
    }, null, this)
    .then(callback, null, this);
};


/**
 * Lets UI know that files are unzipped
 * 
 * @param {Object} entry
 * @private
 */
plugin.file.zip.ZIPParser.prototype.onComplete_ = function(entry) {
  // TODO use semaphore/count method -- the last entry isn't necessarily the last to unzip 
  if (entry.isLast) {
    this.processingZip_ = false;
    this.dispatchEvent(new goog.events.Event(os.events.EventType.COMPLETE));
  }    
};

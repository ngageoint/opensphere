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
  this.processingZip_ = false;

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
   * @type {boolean}
   * @private
   */
  this.semaphore_ = false;

  /**
   * @type {number}
   * @private
   */
  this.zipEntries_ = 0;
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
  this.files_ = [];
  this.source_ = [];
  this.semaphore_ = false;
  this.zipEntries_ = 0;
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
  if (this.zipEntries_ > 0) this.zipEntries_--;

  this.processingZip_ = (this.semaphore_ || this.zipEntries_ > 0);
  this.initialized_ = !this.processingZip_;

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
    this.semaphore_ = true;

    for (var i = 0, n = entries.length; i < n; i++) {
      this.zipEntries_++;

      var entry = entries[i];

      // build an "entry" object, detect filetype mime, etc
      entry.getData(new zip.ArrayBufferWriter(), this.processZIPEntry_.bind(this, entry));
    }

    this.semaphore_ = false;
  }
};


/**
 * @param {Object} entry
 * @param {*} content
 * @private
 */
plugin.file.zip.ZIPParser.prototype.processZIPEntry_ = function(entry, content) {
  if (content && content instanceof ArrayBuffer) {
    var self = this;

    var callback = function(uio) {
      if (uio) {
        var reader = new FileReader();
        reader.onload = self.handleZIPText_.bind(self, uio);
        reader.readAsText(new Blob([content]));
      } else {
        // couldn't determine file type OR is a directory
        self.onComplete_(null);
      }
    };

    this.toUIO_(entry, content, callback);
  } else {
    this.logError_('There was a problem unzipping the file!');
    this.onError();
  }
};


/**
 * @param {Object} uio
 * @param {Event} event
 * @private
 */
plugin.file.zip.ZIPParser.prototype.handleZIPText_ = function(uio, event) {
  var content = (event && event.target) ? event.target.result : null;

  if (content && typeof content === 'string') {
    if (uio) uio['file'].setContent(content);
    this.onComplete_(uio);
  } else {
    this.logError_('There was a problem reading the ZIP content!');
    this.onError();
  }
};


/**
 * Create a UI Object to which Angular can bind form elements
 *
 * @param {Object} entry
 * @param {ArrayBuffer} content
 * @param {Function} callback
 * @private
 */
plugin.file.zip.ZIPParser.prototype.toUIO_ = function(entry, content, callback) {
  // TODO check import support for the file
  if (!entry || !entry.filename || !content || entry.directory) {
    if (callback) callback(null);
    return;
  }

  var file = new os.file.File();
  file.setFileName(entry.filename);
  file.setUrl('local://' + entry.filename);

  var onDetect = function(type) {
    if (type) {
      var chain = os.file.mime.getTypeChain(type);
      if (chain && chain.indexOf(os.file.mime.text.TYPE) > -1) {
        file.convertContentToString();
      }

      file.setContentType(type);
      file.setType(type);
      return file;
    }
    return null;
  };

  var onFile = function(file) {
    if (file) {
      // turn this into a better object for the UI
      return {
        'id': ol.getUid(file),
        'label': entry.filename,
        'valid': true,
        'enabled': true,
        'msg': '',
        'file': file
      };
    }
    return null;
  };

  os.file.mime
      .detect(content, file)
      .then(onDetect)
      .then(onFile)
      .then(callback);
};


/**
 * Add to UI list, and let UI know that files are unzipped
 *
 * @param {Object} uio
 * @private
 */
plugin.file.zip.ZIPParser.prototype.onComplete_ = function(uio) {
  if (uio) this.files_.push(uio);

  if (this.zipEntries_ > 0) this.zipEntries_--;

  // use semaphore/count method -- the last entry isn't necessarily the last to unzip
  if (!this.semaphore_ && this.zipEntries_ == 0) {
    this.processingZip_ = false;
    this.dispatchEvent(new goog.events.Event(os.events.EventType.COMPLETE));
  }
};

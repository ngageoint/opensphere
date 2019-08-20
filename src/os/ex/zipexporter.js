goog.provide('os.ex.ZipExporter');
goog.require('goog.events.Event');
goog.require('os.alert.AlertEventSeverity');
goog.require('os.alert.AlertManager');
goog.require('os.events.EventType');
goog.require('os.ex.AbstractExporter');



/**
 * Base exporter for content supporting compression
 *
 * @extends {os.ex.AbstractExporter.<T>}
 * @constructor
 * @template T
 */
os.ex.ZipExporter = function() {
  os.ex.ZipExporter.base(this, 'constructor');
  this.log = os.ex.ZipExporter.LOGGER_;

  /**
   * If the output should be compressed
   * @type {boolean}
   * @protected
   */
  this.compress = false;

  /**
   * The files to add to the zip
   * @type {!Array.<!os.file.File>}
   * @protected
   */
  this.files = [];

  /**
   * The index of the next file to add to the zip
   * @type {number}
   * @private
   */
  this.fileIndex_ = 0;
};
goog.inherits(os.ex.ZipExporter, os.ex.AbstractExporter);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ex.ZipExporter.LOGGER_ = goog.log.getLogger('os.ex.ZipExporter');


/**
 * Get if output should be compressed.
 *
 * @return {boolean}
 */
os.ex.ZipExporter.prototype.getCompress = function() {
  return this.compress;
};


/**
 * Set if output should be compressed.
 *
 * @param {boolean} value
 */
os.ex.ZipExporter.prototype.setCompress = function(value) {
  if (value && window.zip === undefined) {
    value = false;
    os.alertManager.sendAlert('Compression is not supported in this application! Defaulting to uncompressed output.',
        os.alert.AlertEventSeverity.ERROR, this.log);
  }

  this.compress = value;
};


/**
 * @inheritDoc
 */
os.ex.ZipExporter.prototype.getExtension = function() {
  return '';
};


/**
 * @inheritDoc
 */
os.ex.ZipExporter.prototype.getLabel = function() {
  return 'ZIP';
};


/**
 * Handle error creating the zip writer.
 *
 * @param {string} errorMsg The error message
 * @protected
 */
os.ex.ZipExporter.prototype.reportError = function(errorMsg) {
  var msg = 'Error creating ' + this.getLabel() + ' file: ' + errorMsg;
  os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.ERROR, this.log);
  this.dispatchEvent(new goog.events.Event(os.events.EventType.ERROR));
};


/**
 * @inheritDoc
 */
os.ex.ZipExporter.prototype.isAsync = function() {
  // only asynchronous if compression is being used
  return this.compress;
};


/**
 * @inheritDoc
 */
os.ex.ZipExporter.prototype.reset = function() {
  os.ex.ZipExporter.base(this, 'reset');
  this.files.length = 0;
  this.fileIndex_ = 0;
};


/**
 * @inheritDoc
 */
os.ex.ZipExporter.prototype.process = function() {
  this.processItems();

  if (this.files.length > 0) {
    if (this.compress) {
      this.compressFiles_();
    } else {
      // just use the first file - there should not be multiple if compression is not used
      this.output = this.files[0].getContent();

      // dispatch the complete event in case async is assumed
      this.dispatchEvent(new goog.events.Event(os.events.EventType.COMPLETE));
    }
  } else {
    this.reportError('No output created by export process');
  }
};


/**
 * Processes exporter items, populating the files array. This should be implemented by extending classes.
 */
os.ex.ZipExporter.prototype.processItems = function() {};


/**
 * Adds a file to the files array.
 *
 * @param {!os.file.File} file The file to add
 */
os.ex.ZipExporter.prototype.addFile = function(file) {
  this.files.push(file);
};


/**
 * Returns the files array.
 *
 * @return {Array<!os.file.File>}
 */
os.ex.ZipExporter.prototype.getFiles = function() {
  return this.files;
};


/**
 * Compresses files and creates the output archive.
 *
 * @private
 */
os.ex.ZipExporter.prototype.compressFiles_ = function() {
  this.fileIndex_ = 0;
  zip.createWriter(new zip.BlobWriter(), this.writeNextFile_.bind(this), this.reportError.bind(this));
};


/**
 * Handle successful zip writer creation.
 *
 * @param {!zip.Writer} writer The zip writer
 * @private
 */
os.ex.ZipExporter.prototype.writeNextFile_ = function(writer) {
  if (this.fileIndex_ < this.files.length) {
    var file = this.files[this.fileIndex_++];
    var fileName = file.getFileName();
    var content = file.getContent();

    if (fileName) {
      if (typeof content === 'string') {
        writer.add(fileName, new zip.TextReader(content), this.writeNextFile_.bind(this, writer));
      } else if (content instanceof ArrayBuffer) {
        writer.add(fileName, new zip.ArrayBufferReader(content), this.writeNextFile_.bind(this, writer));
      } else if (content instanceof Blob) {
        writer.add(fileName, new zip.BlobReader(content), this.writeNextFile_.bind(this, writer));
      } else {
        // we don't know how to handle this content...
        this.reportError('Unrecognized datatype');
      }
    } else {
      // no filename
      this.reportError('No filename provided');
    }
  } else {
    writer.close(this.onZipComplete_.bind(this));
  }
};


/**
 * Handle zip process completion.
 *
 * @param {Blob} zip The zip file
 * @private
 */
os.ex.ZipExporter.prototype.onZipComplete_ = function(zip) {
  this.output = zip;
  this.dispatchEvent(new goog.events.Event(os.events.EventType.COMPLETE));
};

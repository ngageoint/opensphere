goog.module('os.ex.ZipExporter');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');
const log = goog.require('goog.log');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const EventType = goog.require('os.events.EventType');
const AbstractExporter = goog.require('os.ex.AbstractExporter');


/**
 * Base exporter for content supporting compression
 *
 * @extends {AbstractExporter<T>}
 * @template T
 */
class ZipExporter extends AbstractExporter {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.log = logger;

    /**
     * If the output should be compressed
     * @type {boolean}
     * @protected
     */
    this.compress = false;

    /**
     * The files to add to the zip
     * @type {!Array<!os.file.File>}
     * @protected
     */
    this.files = [];

    /**
     * The index of the next file to add to the zip
     * @type {number}
     * @private
     */
    this.fileIndex_ = 0;
  }

  /**
   * Get if output should be compressed.
   *
   * @return {boolean}
   */
  getCompress() {
    return this.compress;
  }

  /**
   * Set if output should be compressed.
   *
   * @param {boolean} value
   */
  setCompress(value) {
    if (value && window.zip === undefined) {
      value = false;
      AlertManager.getInstance().sendAlert(
          'Compression is not supported in this application! Defaulting to uncompressed output.',
          AlertEventSeverity.ERROR, this.log);
    }

    this.compress = value;
  }

  /**
   * @inheritDoc
   */
  getExtension() {
    return '';
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    return 'ZIP';
  }

  /**
   * Handle error creating the zip writer.
   *
   * @param {string} errorMsg The error message
   * @protected
   */
  reportError(errorMsg) {
    var msg = 'Error creating ' + this.getLabel() + ' file: ' + errorMsg;
    AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR, this.log);
    this.dispatchEvent(new GoogEvent(EventType.ERROR));
  }

  /**
   * @inheritDoc
   */
  isAsync() {
    // only asynchronous if compression is being used
    return this.compress;
  }

  /**
   * @inheritDoc
   */
  reset() {
    super.reset();
    this.files.length = 0;
    this.fileIndex_ = 0;
  }

  /**
   * @inheritDoc
   */
  process() {
    this.processItems();

    if (this.files.length > 0) {
      if (this.compress) {
        this.compressFiles_();
      } else {
        // just use the first file - there should not be multiple if compression is not used
        this.output = this.files[0].getContent();

        // dispatch the complete event in case async is assumed
        this.dispatchEvent(new GoogEvent(EventType.COMPLETE));
      }
    } else {
      this.reportError('No output created by export process');
    }
  }

  /**
   * Processes exporter items, populating the files array. This should be implemented by extending classes.
   */
  processItems() {}

  /**
   * Adds a file to the files array.
   *
   * @param {!os.file.File} file The file to add
   */
  addFile(file) {
    this.files.push(file);
  }

  /**
   * Returns the files array.
   *
   * @return {Array<!os.file.File>}
   */
  getFiles() {
    return this.files;
  }

  /**
   * Compresses files and creates the output archive.
   *
   * @private
   */
  compressFiles_() {
    this.fileIndex_ = 0;
    zip.createWriter(new zip.BlobWriter(), this.writeNextFile_.bind(this), this.reportError.bind(this));
  }

  /**
   * Handle successful zip writer creation.
   *
   * @param {!zip.Writer} writer The zip writer
   * @private
   */
  writeNextFile_(writer) {
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
  }

  /**
   * Handle zip process completion.
   *
   * @param {Blob} zip The zip file
   * @private
   */
  onZipComplete_(zip) {
    this.output = zip;
    this.dispatchEvent(new GoogEvent(EventType.COMPLETE));
  }
}

/**
 * Logger
 * @type {goog.log.Logger}
 */
const logger = log.getLogger('os.ex.ZipExporter');

exports = ZipExporter;

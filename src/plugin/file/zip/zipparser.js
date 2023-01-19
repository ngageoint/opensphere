goog.declareModuleId('plugin.file.zip.ZIPParser');

import {getUid} from 'ol/src/util.js';
import EventType from '../../../os/events/eventtype.js';
import OSFile from '../../../os/file/file.js';
import * as text from '../../../os/file/mime/text.js';
import * as mimeZip from '../../../os/file/mime/zip.js';
import * as mime from '../../../os/file/mime.js';
import AsyncZipParser from '../../../os/parse/asynczipparser.js';

const googEvents = goog.require('goog.events');

const GoogEvent = goog.require('goog.events.Event');
const log = goog.require('goog.log');


/**
 * A ZIP file parser
 *
 * @extends {AsyncZipParser<Feature>}
 */
export default class ZIPParser extends AsyncZipParser {
  /**
   * Constructor.
   * @param {ZIPParserConfig} config
   */
  constructor(config) {
    super();

    /**
     * @type {ZIPParserConfig}
     * @private
     */
    this.config_ = config;

    /**
     * @type {Array<FileWrapper>}
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
     * @type {Array<ArrayBuffer>}
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
  }

  /**
   * @inheritDoc
   */
  cleanup() {
    this.initialized_ = false;
    this.files_ = [];
    this.source_ = [];
    this.semaphore_ = false;
    this.zipEntries_ = 0;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.cleanup();
    this.source_.length = 0;
  }

  /**
   * @return {Array<FileWrapper>}
   */
  getFiles() {
    return this.files_;
  }

  /**
   * @inheritDoc
   */
  hasNext() {
    return this.initialized_;
  }

  /**
   * @inheritDoc
   */
  parseNext() {
    var file = null;

    if (file) {
      file.setId(String(getUid(file)));
    }

    if (!this.hasNext()) {
      this.closeZipReaders();
    }

    return file;
  }

  /**
   * Unzip the file in the ZIPParserConfig
   * @public
   */
  unzip() {
    var content = (this.config_['file']) ? this.config_['file'].getContent() : null;

    if (content) {
      // listen for complete or error...
      googEvents.listenOnce(
          this,
          [EventType.COMPLETE, EventType.ERROR],
          function(evt) {
            // push the unzipped files to the UI
            var files = this.getFiles();
            if (files) {
              for (var i = 0; i < files.length; i++) this.config_['files'].push(files[i]);
            }
            this.config_['status'] = (evt.type == EventType.COMPLETE) ? 0 : -2; // done
            this.dispose(); // clean up the memory
          }.bind(this),
          false, this);

      this.config_['status'] = 1; // flag UI that parser is working...

      this.setSource(content); // begin the unzip
    }
  }

  /**
   * @inheritDoc
   */
  setSource(source) {
    // reset necessary values
    this.initialized_ = false;
    this.processingZip_ = false;
    this.source_.length = 0;

    if (!source) {
      return;
    }

    if (Array.isArray(source)) {
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
  }

  /**
   * Configures the parser using the provided file(s).
   *
   * @private
   */
  initialize_() {
    var i = this.source_.length;
    while (i--) {
      var source = this.source_[i];
      if (mimeZip.isZip(source)) {
        this.createZipReader(source);
      }
    }
  }

  /**
   * @inheritDoc
   */
  onError() {
    // clear memory and tell anyone listening that there's a problem
    this.zipEntries_ = 0;
    this.files_ = [];
    this.processingZip_ = false;
    this.initialized_ = true;

    this.dispatchEvent(new GoogEvent(EventType.ERROR));

    super.onError();
  }

  /**
   * @inheritDoc
   */
  onReady() {
    this.initialized_ = true;
    this.processingZip_ = false;
    super.onReady();
  }

  /**
   * @param {string} msg
   * @private
   */
  logWarning_(msg) {
    log.warning(logger, msg);
  }

  /**
   * @param {string} msg
   * @private
   */
  logError_(msg) {
    log.error(logger, msg);
  }

  /**
   * @inheritDoc
   */
  createZipReader(source) {
    this.processingZip_ = true; // flag processing
    super.createZipReader(source);
  }

  /**
   * @inheritDoc
   */
  handleZipEntries(entries) {
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
  }

  /**
   * @param {zip.Entry} entry
   * @param {*} content
   * @private
   */
  processZIPEntry_(entry, content) {
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
      this.onFailure_();
    }
  }

  /**
   * @param {FileWrapper} uio
   * @param {Event} event
   * @private
   */
  handleZIPText_(uio, event) {
    var content = (event && event.target) ? event.target.result : null;

    if (content && typeof content === 'string') {
      if (uio) uio.file.setContent(content);
      this.onComplete_(uio);
    } else {
      this.logError_('There was a problem reading the ZIP content!');
      this.onFailure_();
    }
  }

  /**
   * Create a UI Object to which Angular can bind form elements
   *
   * @param {Object} entry
   * @param {ArrayBuffer} content
   * @param {Function} callback
   * @private
   */
  toUIO_(entry, content, callback) {
    if (!entry || !entry.filename || !content || entry.directory) {
      if (callback) callback(null);
      return;
    }

    var file = new OSFile();
    file.setFileName(entry.filename);
    file.setUrl('local://' + entry.filename);

    var onDetect = function(type) {
      if (type) {
        var chain = mime.getTypeChain(type);
        if (chain && chain.indexOf(text.TYPE) > -1) {
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
        return /** @type {FileWrapper} */ ({
          id: getUid(file),
          label: entry.filename,
          valid: true,
          enabled: true,
          msg: '',
          file: file
        });
      }
      return null;
    };

    mime.detect(content, file)
        .then(onDetect)
        .then(onFile)
        .then(callback);
  }

  /**
   * Add to UI list, and let UI know that files are unzipped
   *
   * @param {FileWrapper|null} uio
   * @private
   */
  onComplete_(uio) {
    if (uio) this.files_.push(uio);

    if (this.zipEntries_ > 0) this.zipEntries_--;

    // use semaphore/count method -- the last entry isn't necessarily the last to unzip
    if (!this.semaphore_ && this.zipEntries_ == 0) {
      this.processingZip_ = false;
      this.dispatchEvent(new GoogEvent(EventType.COMPLETE));
    }
  }

  /**
   * This entry failed for some reason; decrement counters and continue unzipping
   *
   * @private
   */
  onFailure_() {
    if (this.zipEntries_ > 0) this.zipEntries_--;

    this.processingZip_ = (this.semaphore_ || this.zipEntries_ > 0);
    this.initialized_ = !this.processingZip_;

    if (this.initialized_ && this.files_.length == 0) {
      this.onError();
    }
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('plugin.file.zip.ZIPParser');

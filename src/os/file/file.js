goog.declareModuleId('os.file.File');

import IPersistable from '../ipersistable.js';// eslint-disable-line
import {getText} from './mime/text.js';

const Deferred = goog.require('goog.async.Deferred');
const GoogFileReader = goog.require('goog.fs.FileReader');


/**
 * Representation of a file.
 *
 * @implements {IPersistable}
 */
export default class OSFile {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {?(ArrayBuffer|Object|string)}
     * @private
     */
    this.content_ = null;

    /**
     * @type {?string}
     * @private
     */
    this.contentType_ = null;

    /**
     * @type {?string}
     * @private
     */
    this.fileName_ = null;

    /**
     * A reference to the original file from which this container was created. Not required, used only in
     * some cases.
     * @type {?File}
     * @private
     */
    this.file_ = null;

    /**
     * @type {?string}
     * @private
     */
    this.type_ = null;

    /**
     * @type {?string}
     * @private
     */
    this.url_ = null;

    /**
     * @type {?string}
     * @private
     */
    this.encoding_ = null;
  }

  /**
   * @return {?string} The encoding used
   */
  getEncoding() {
    return this.encoding_;
  }

  /**
   * @param {?string} value The encoding
   */
  setEncoding(value) {
    this.encoding_ = value;
  }

  /**
   * @return {?(Object|string)}
   */
  getContent() {
    return this.content_;
  }

  /**
   * @param {?(ArrayBuffer|Object|string)} value
   */
  setContent(value) {
    this.content_ = value;
  }

  /**
   * Converts ArrayBuffer content to a string
   */
  convertContentToString() {
    var value = this.getContent();
    if (value instanceof ArrayBuffer) {
      var ab = /** @type {ArrayBuffer} */ (value);
      var s = getText(ab, this);
      if (s) {
        this.setContent(s);
      }
    }
  }

  /**
   * @return {?string}
   */
  getContentType() {
    return this.contentType_;
  }

  /**
   * @param {?string} value
   */
  setContentType(value) {
    this.contentType_ = value;
  }

  /**
   * @return {?string}
   */
  getFileName() {
    return this.fileName_;
  }

  /**
   * @param {?string} value
   */
  setFileName(value) {
    this.fileName_ = value;
  }

  /**
   * @return {?File}
   */
  getFile() {
    return this.file_;
  }

  /**
   * @param {?File} value
   */
  setFile(value) {
    this.file_ = value;
  }

  /**
   * @return {?string}
   */
  getType() {
    return this.type_;
  }

  /**
   * @param {?string} value
   */
  setType(value) {
    this.type_ = value;
  }

  /**
   * @return {?string}
   */
  getUrl() {
    return this.url_;
  }

  /**
   * @param {?string} value
   */
  setUrl(value) {
    this.url_ = value;
  }

  /**
   * @return {Deferred|undefined}
   */
  loadContent() {
    var origFile = this.getFile();
    if (origFile) {
      var deferred = new Deferred();
      var scope = this;
      GoogFileReader.readAsArrayBuffer(origFile).addCallback(
          function(resp) {
            scope.setContent(resp);
            return null;
          }).chainDeferred(deferred);
      return deferred;
    }
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    var to = opt_to || {};
    to['content'] = this.content_;
    to['contentType'] = this.contentType_;
    to['fileName'] = this.fileName_;
    to['type'] = this.type_;
    to['url'] = this.url_;
    to['encoding'] = this.encoding_;

    return to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    this.content_ = config['content'] || null;
    this.contentType_ = config['contentType'] || null;
    this.fileName_ = config['fileName'] || null;
    this.type_ = config['type'] || null;
    this.url_ = config['url'] || null;
    this.encoding_ = config['encoding'] || null;
  }
}

/**
 * Maximum content length for imported files.
 * @type {number}
 * @const
 */
OSFile.MAX_CONTENT_LEN = 1024 * 1024 * 100;

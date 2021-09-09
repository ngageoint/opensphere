goog.module('os.net.CustomFormatter');

const IDataFormatter = goog.requireType('os.net.IDataFormatter');


/**
 * Create a text payload.
 *
 * @implements {IDataFormatter}
 */
class CustomFormatter {
  /**
   * Constructor.
   * @param {string=} opt_contentType the MIME type of the string data; default is 'text'
   * @param {(ArrayBuffer|ArrayBufferView|Blob|Document|FormData|null|string|undefined)=} opt_content
   */
  constructor(opt_contentType, opt_content) {
    /**
     * The MIME type of the payload
     * @type {!string}
     * @private
     */
    this.contentType_ = opt_contentType != null ? opt_contentType : 'text';

    /**
     * @private
     * @type {(ArrayBuffer|ArrayBufferView|Blob|Document|FormData|null|string|undefined)}
     */
    this.content_ = opt_content || '';
  }

  /**
   * @return {(ArrayBuffer|ArrayBufferView|Blob|Document|FormData|null|string|undefined)}
   */
  getContent() {
    return this.content_;
  }

  /**
   * @param {(ArrayBuffer|ArrayBufferView|Blob|Document|FormData|null|string|undefined)} content
   */
  setContent(content) {
    this.content_ = content;
  }

  /**
   * @inheritDoc
   */
  getContentType() {
    return this.contentType_;
  }

  /**
   * @inheritDoc
   */
  format(uri) {
    return this.content_;
  }
}

exports = CustomFormatter;

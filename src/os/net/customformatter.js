goog.provide('os.net.CustomFormatter');
goog.require('os.net.IDataFormatter');



/**
 * Create a text payload.
 * @implements {os.net.IDataFormatter}
 * @constructor
 * @param {string=} opt_contentType the MIME type of the string data; default is 'text'
 * @param {(ArrayBuffer|ArrayBufferView|Blob|Document|FormData|null|string|undefined)=} opt_content
 */
os.net.CustomFormatter = function(opt_contentType, opt_content) {
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
};


/**
 * @return {(ArrayBuffer|ArrayBufferView|Blob|Document|FormData|null|string|undefined)}
 */
os.net.CustomFormatter.prototype.getContent = function() {
  return this.content_;
};


/**
 * @param {(ArrayBuffer|ArrayBufferView|Blob|Document|FormData|null|string|undefined)} content
 */
os.net.CustomFormatter.prototype.setContent = function(content) {
  this.content_ = content;
};


/**
 * @inheritDoc
 */
os.net.CustomFormatter.prototype.getContentType = function() {
  return this.contentType_;
};


/**
 * @inheritDoc
 */
os.net.CustomFormatter.prototype.format = function(uri) {
  return this.content_;
};

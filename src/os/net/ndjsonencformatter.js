goog.provide('os.net.NDJsonEncFormatter');
goog.require('os.net.IDataFormatter');



/**
 * Creates an application/json payload
 *
 * @implements {os.net.IDataFormatter}
 * @param {Array<Object>} content The JSON objects to format.
 * @param {?function(string, *)=} opt_replacer The JSON object to format.
 * @param {string=} opt_contentType The Content-Type to set.
 * @constructor
 */
os.net.NDJsonEncFormatter = function(content, opt_replacer, opt_contentType) {
  /**
   * @type {Array<Object>}
   * @private
   */
  this.content_ = content;

  /**
   * @type {string|undefined}
   * @private
   */
  this.opt_contentType_ = opt_contentType;
};


/**
 * @return {Array<Object>}
 */
os.net.NDJsonEncFormatter.prototype.getContent = function() {
  return this.content_;
};


/**
 * @param {Array<Object>} content
 */
os.net.NDJsonEncFormatter.prototype.setContent = function(content) {
  this.content_ = content;
};


/**
 * @inheritDoc
 */
os.net.NDJsonEncFormatter.prototype.getContentType = function() {
  return this.opt_contentType_ || 'application/x-ndjson';
};


/**
 * @inheritDoc
 */
os.net.NDJsonEncFormatter.prototype.format = function(uri) {
  var payload = '';
  this.content_.forEach(function(content) {
    payload += JSON.stringify(content) + '\n';
  });
  return payload;
};

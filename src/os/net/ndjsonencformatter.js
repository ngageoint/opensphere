goog.provide('os.net.NDJsonEncFormatter');
goog.require('os.net.IDataFormatter');



/**
 * Creates an application/json payload
 * @implements {os.net.IDataFormatter}
 * @param {Array<Object>} opt_content The JSON objects to format.
 * @param {?function(string, *)=} opt_replacer The JSON object to format.
 * @constructor
 */
os.net.NDJsonEncFormatter = function(opt_content, opt_replacer) {
  /**
   * @type {Array<Object>}
   * @private
   */
  this.content_ = opt_content;
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
  return 'application/x-ndjson';
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

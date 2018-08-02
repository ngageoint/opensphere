goog.provide('os.net.JsonEncFormatter');
goog.require('os.net.IDataFormatter');



/**
 * Creates an application/json payload
 * @implements {os.net.IDataFormatter}
 * @param {Object=} opt_content The JSON object to format.
 * @param {?function(string, *)=} opt_replacer The JSON object to format.
 * @constructor
 */
os.net.JsonEncFormatter = function(opt_content, opt_replacer) {
  /**
   * @type {*}
   * @private
   */
  this.content_ = opt_content;


  /**
   * @type {?function(string, *)}
   * @private
   */
  this.replacer_ = opt_replacer || null;
};


/**
 * @return {*}
 */
os.net.JsonEncFormatter.prototype.getContent = function() {
  return this.content_;
};


/**
 * @param {*} content
 */
os.net.JsonEncFormatter.prototype.setContent = function(content) {
  this.content_ = content;
};


/**
 * @inheritDoc
 */
os.net.JsonEncFormatter.prototype.getContentType = function() {
  return 'application/json;charset=UTF-8';
};


/**
 * Sets the replacer function called for each (key, value) pair that determines how
 * the value should be serialized.
 * @param {?function(string, *)} replacer
 */
os.net.JsonEncFormatter.prototype.setReplacer = function(replacer) {
  this.replacer_ = replacer;
};


/**
 * @inheritDoc
 */
os.net.JsonEncFormatter.prototype.format = function(uri) {
  return JSON.stringify(this.content_, this.replacer_);
};

goog.provide('os.net.ParamModifier');
goog.require('goog.asserts');
goog.require('goog.string');
goog.require('os.net.AbstractModifier');



/**
 * URI parameter replacement modifier.
 * @param {string} id Identifier for the modifier
 * @param {string} param Parameter to modify
 * @param {string|RegExp} replaceTerm The term to replace
 * @param {string|Function} replacement The replacement value
 * @param {number=} opt_priority Priority of the modifier
 * @extends {os.net.AbstractModifier}
 * @constructor
 */
os.net.ParamModifier = function(id, param, replaceTerm, replacement, opt_priority) {
  os.net.ParamModifier.base(this, 'constructor', id, opt_priority);

  /**
   * @type {string}
   * @private
   */
  this.param_ = param;

  /**
   * @type {string|RegExp}
   * @private
   */
  this.replaceTerm_ = replaceTerm;

  /**
   * @type {string|Function}
   * @private
   */
  this.replacement_ = replacement;
};
goog.inherits(os.net.ParamModifier, os.net.AbstractModifier);


/**
 * @return {string|Function}
 */
os.net.ParamModifier.prototype.getReplacement = function() {
  return this.replacement_;
};


/**
 * @param {string|Function} replacement
 */
os.net.ParamModifier.prototype.setReplacement = function(replacement) {
  this.replacement_ = replacement;
};


/**
 * @return {string|RegExp}
 */
os.net.ParamModifier.prototype.getReplaceTerm = function() {
  return this.replaceTerm_;
};


/**
 * @param {string|RegExp} replaceTerm
 */
os.net.ParamModifier.prototype.setReplaceTerm = function(replaceTerm) {
  this.replaceTerm_ = replaceTerm;
};


/**
 * @return {string}
 */
os.net.ParamModifier.prototype.getParam = function() {
  return this.param_;
};


/**
 * @param {string} param
 */
os.net.ParamModifier.prototype.setParam = function(param) {
  this.param_ = param;
};


/**
 * @inheritDoc
 */
os.net.ParamModifier.prototype.modify = function(uri) {
  goog.asserts.assert(!goog.string.isEmptySafe(this.param_),
      'The parameter for modifier ' + this.getId() + ' was not set. Request will not load.');
  goog.asserts.assert(!goog.string.isEmptySafe(this.replaceTerm_),
      'The replacement term for modifier ' + this.getId() + ' was not set. Request will not load.');
  goog.asserts.assert(goog.isDefAndNotNull(this.replacement_),
      'The replacement for modifier ' + this.getId() + ' was not set. Request will not load.');

  var qd = uri.getQueryData();
  var old = qd.get(this.param_);
  if (old) {
    qd.set(this.param_, old.replace(this.replaceTerm_, this.replacement_));
  }
};

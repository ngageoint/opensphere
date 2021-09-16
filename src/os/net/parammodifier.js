goog.module('os.net.ParamModifier');

const {assert} = goog.require('goog.asserts');
const {isEmptyOrWhitespace, makeSafe} = goog.require('goog.string');
const AbstractModifier = goog.require('os.net.AbstractModifier');


/**
 * URI parameter replacement modifier.
 */
class ParamModifier extends AbstractModifier {
  /**
   * Constructor.
   * @param {string} id Identifier for the modifier
   * @param {string} param Parameter to modify
   * @param {string|RegExp} replaceTerm The term to replace
   * @param {string|Function} replacement The replacement value
   * @param {number=} opt_priority Priority of the modifier
   */
  constructor(id, param, replaceTerm, replacement, opt_priority) {
    super(id, opt_priority);

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
  }

  /**
   * @return {string|Function}
   */
  getReplacement() {
    return this.replacement_;
  }

  /**
   * @param {string|Function} replacement
   */
  setReplacement(replacement) {
    this.replacement_ = replacement;
  }

  /**
   * @return {string|RegExp}
   */
  getReplaceTerm() {
    return this.replaceTerm_;
  }

  /**
   * @param {string|RegExp} replaceTerm
   */
  setReplaceTerm(replaceTerm) {
    this.replaceTerm_ = replaceTerm;
  }

  /**
   * @return {string}
   */
  getParam() {
    return this.param_;
  }

  /**
   * @param {string} param
   */
  setParam(param) {
    this.param_ = param;
  }

  /**
   * @inheritDoc
   */
  modify(uri) {
    assert(!isEmptyOrWhitespace(makeSafe(this.param_)),
        'The parameter for modifier ' + this.getId() + ' was not set. Request will not load.');
    assert(!isEmptyOrWhitespace(makeSafe(this.replaceTerm_)),
        'The replacement term for modifier ' + this.getId() + ' was not set. Request will not load.');
    assert(this.replacement_ != null,
        'The replacement for modifier ' + this.getId() + ' was not set. Request will not load.');

    var qd = uri.getQueryData();
    var old = qd.get(this.param_);
    if (old) {
      qd.set(this.param_, old.replace(this.replaceTerm_, this.replacement_));
    }
  }
}

exports = ParamModifier;

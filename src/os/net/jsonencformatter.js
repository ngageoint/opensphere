goog.declareModuleId('os.net.JsonEncFormatter');

const {default: IDataFormatter} = goog.requireType('os.net.IDataFormatter');


/**
 * Creates an application/json payload
 *
 * @implements {IDataFormatter}
 */
export default class JsonEncFormatter {
  /**
   * Constructor.
   * @param {Object=} opt_content The JSON object to format.
   * @param {?function(string, *)=} opt_replacer The JSON object to format.
   */
  constructor(opt_content, opt_replacer) {
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
  }

  /**
   * @return {*}
   */
  getContent() {
    return this.content_;
  }

  /**
   * @param {*} content
   */
  setContent(content) {
    this.content_ = content;
  }

  /**
   * @inheritDoc
   */
  getContentType() {
    return 'application/json;charset=UTF-8';
  }

  /**
   * Sets the replacer function called for each (key, value) pair that determines how
   * the value should be serialized.
   *
   * @param {?function(string, *)} replacer
   */
  setReplacer(replacer) {
    this.replacer_ = replacer;
  }

  /**
   * @inheritDoc
   */
  format(uri) {
    return JSON.stringify(this.content_, this.replacer_);
  }
}

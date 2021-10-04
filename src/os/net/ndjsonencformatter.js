goog.declareModuleId('os.net.NDJsonEncFormatter');

const {default: IDataFormatter} = goog.requireType('os.net.IDataFormatter');


/**
 * Creates an application/json payload
 *
 * @implements {IDataFormatter}
 */
export default class NDJsonEncFormatter {
  /**
   * Constructor.
   * @param {Array<Object>} content The JSON objects to format.
   * @param {?function(string, *)=} opt_replacer The JSON object to format.
   * @param {string=} opt_contentType The Content-Type to set.
   */
  constructor(content, opt_replacer, opt_contentType) {
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
  }

  /**
   * @return {Array<Object>}
   */
  getContent() {
    return this.content_;
  }

  /**
   * @param {Array<Object>} content
   */
  setContent(content) {
    this.content_ = content;
  }

  /**
   * @inheritDoc
   */
  getContentType() {
    return this.opt_contentType_ || 'application/x-ndjson';
  }

  /**
   * @inheritDoc
   */
  format(uri) {
    var payload = '';
    this.content_.forEach(function(content) {
      payload += JSON.stringify(content) + '\n';
    });
    return payload;
  }
}

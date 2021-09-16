goog.module('os.state.XMLStateOptions');

const StateOptions = goog.require('os.state.StateOptions');


/**
 * Options for saving and loading state files as XML.
 */
class XMLStateOptions extends StateOptions {
  /**
   * Constructor.
   * @param {string} title The state title
   * @param {Document=} opt_doc The state XML document
   */
  constructor(title, opt_doc) {
    super(title);

    /**
     * The state XML document
     * @type {Document}
     */
    this.doc = opt_doc || null;
  }
}

exports = XMLStateOptions;

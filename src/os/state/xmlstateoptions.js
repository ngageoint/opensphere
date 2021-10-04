goog.declareModuleId('os.state.XMLStateOptions');

import StateOptions from './stateoptions.js';


/**
 * Options for saving and loading state files as XML.
 */
export default class XMLStateOptions extends StateOptions {
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

goog.declareModuleId('os.state.JSONStateOptions');

import StateOptions from './stateoptions.js';


/**
 * Options for saving and loading state files as JSON.
 */
export default class JSONStateOptions extends StateOptions {
  /**
   * Constructor.
   * @param {string} title The state title
   * @param {Object<string, *>=} opt_obj The state JSON object
   */
  constructor(title, opt_obj) {
    super(title);

    /**
     * The state JSON object
     * @type {Object<string, *>}
     */
    this.obj = opt_obj || null;
  }
}

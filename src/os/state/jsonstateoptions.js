goog.module('os.state.JSONStateOptions');
goog.module.declareLegacyNamespace();

const StateOptions = goog.require('os.state.StateOptions');


/**
 * Options for saving and loading state files as JSON.
 */
class JSONStateOptions extends StateOptions {
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

exports = JSONStateOptions;

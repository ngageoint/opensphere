goog.provide('os.state.JSONStateOptions');
goog.require('os.state.StateOptions');



/**
 * Options for saving and loading state files as JSON.
 * @param {string} title The state title
 * @param {Object.<string, *>=} opt_obj The state JSON object
 * @extends {os.state.StateOptions}
 * @constructor
 */
os.state.JSONStateOptions = function(title, opt_obj) {
  os.state.JSONStateOptions.base(this, 'constructor', title);

  /**
   * The state JSON object
   * @type {Object.<string, *>}
   */
  this.obj = opt_obj || null;
};
goog.inherits(os.state.JSONStateOptions, os.state.StateOptions);

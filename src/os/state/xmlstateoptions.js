goog.provide('os.state.XMLStateOptions');
goog.require('os.state.StateOptions');



/**
 * Options for saving and loading state files as XML.
 * @param {string} title The state title
 * @param {Document=} opt_doc The state XML document
 * @extends {os.state.StateOptions}
 * @constructor
 */
os.state.XMLStateOptions = function(title, opt_doc) {
  os.state.XMLStateOptions.base(this, 'constructor', title);

  /**
   * The state XML document
   * @type {Document}
   */
  this.doc = opt_doc || null;
};
goog.inherits(os.state.XMLStateOptions, os.state.StateOptions);

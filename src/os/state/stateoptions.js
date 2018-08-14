goog.provide('os.state.StateOptions');



/**
 * Options for saving and loading state files.
 * @param {string} title The state title
 * @constructor
 */
os.state.StateOptions = function(title) {
  /**
   * The state description
   * @type {?string}
   */
  this.description = null;

  /**
   * If the state should be loaded on save
   * @type {boolean}
   */
  this.load = false;

  /**
   * The persistence method to use when saving the state
   * @type {os.ex.IPersistenceMethod}
   */
  this.method = null;

  /**
   * The states to save/load
   * @type {Array.<!os.state.IState>}
   */
  this.states = null;

  /**
   * The state tags/keywords
   * @type {?string}
   */
  this.tags = null;

  /**
   * The state title
   * @type {string}
   */
  this.title = title;
};

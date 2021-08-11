goog.module('os.state.StateOptions');
goog.module.declareLegacyNamespace();

const IPersistenceMethod = goog.requireType('os.ex.IPersistenceMethod');
const IState = goog.requireType('os.state.IState');


/**
 * Options for saving and loading state files.
 */
class StateOptions {
  /**
   * Constructor.
   * @param {string} title The state title
   */
  constructor(title) {
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
     * @type {IPersistenceMethod}
     */
    this.method = null;

    /**
     * The states to save/load
     * @type {Array<!IState>}
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
  }
}

exports = StateOptions;

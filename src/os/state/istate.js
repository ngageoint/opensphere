goog.declareModuleId('os.state.IState');

const Deferred = goog.requireType('goog.async.Deferred');


/**
 * @interface
 * @template T,S
 */
export default class IState {
  /**
   * Get if the state is supported
   * @return {boolean} If the state is supported
   */
  getSupported() {}

  /**
   * Set if the state is supported
   * @param {boolean} value The new supported value
   */
  setSupported(value) {}

  /**
   * Get if the state is enabled.
   * @return {boolean} If the state is enabled
   */
  getEnabled() {}

  /**
   * Set if the state is enabled.
   * @param {boolean} value The new enabled value
   */
  setEnabled(value) {}

  /**
   * Get the state title.
   * @return {string} The title
   */
  getTitle() {}

  /**
   * Get the state description.
   * @return {string} The description
   */
  getDescription() {}

  /**
   * Get attributes for the state's root object.
   * @return {Object<string, string>} The root object attributes
   */
  getRootAttrs() {}

  /**
   * Get the root name for the state object.
   * @return {string} The root name
   */
  getRootName() {}

  /**
   * Get the saved state.
   * @return {T} The saved state
   */
  getSavedState() {}

  /**
   * Get the priority of the state. Higher values execute first.
   * @return {number} The state's priority
   */
  getPriority() {}

  /**
   * Load the given state.
   * @param {T|string} obj The state object to load
   * @param {string} id The ID of the current state
   * @param {?string=} opt_title Optional title/name of the state
   */
  load(obj, id, opt_title) {}

  /**
   * Write the current state.
   * @param {S} options Save options
   * @return {!Deferred} A promise that resolves when the state has been written.
   */
  save(options) {}

  /**
   * Removes the given state.
   * @param {string} id The state ID to remove
   */
  remove(id) {}
}

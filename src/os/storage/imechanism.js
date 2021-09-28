goog.declareModuleId('os.storage.IMechanism');

/**
 * Interface for a storage mechanism that expands on {@link goog.storage.mechanism.IterableMechanism}.
 *
 * @interface
 * @template T
 */
export default class IMechanism {
  /**
   * Get the value stored under a key.
   *
   * @param {string} key The key to get.
   * @return {?string} The corresponding value, null if not found.
   */
  get(key) {}

  /**
   * Get all items in storage.
   * @return {!Array<T>}
   */
  getAll() {}

  /**
   * Get the number of stored key-value pairs.
   *
   * Could be overridden in a subclass, as the default implementation is not very
   * efficient - it iterates over all keys.
   *
   * @return {number} Number of stored elements.
   */
  getCount() {}

  /**
   * Remove all key-value pairs.
   *
   * Could be overridden in a subclass, as the default implementation is not very
   * efficient - it iterates over all keys.
   */
  clear() {}

  /**
   * Set a value for a key.
   *
   * @param {string} key The key to set.
   * @param {string} value The string to save.
   */
  set(key, value) {}

  /**
   * Remove a key and its value.
   *
   * @param {string} key The key to remove.
   */
  remove(key) {}
}


/**
 * Interface id for use with os.implements.
 * @type {string}
 */
IMechanism.ID = 'os.storage.IMechanism';

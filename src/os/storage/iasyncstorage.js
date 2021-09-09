goog.module('os.storage.IAsyncStorage');

const Deferred = goog.requireType('goog.async.Deferred');


/**
 * Interface for asynchronous storage mechanisms
 *
 * @interface
 * @template T
 */
class IAsyncStorage {
  /**
   * Initialize storage
   * @return {!Deferred}
   */
  init() {}

  /**
   * Get the value stored under a key.
   *
   * @param {string} key The key to get.
   * @return {!Deferred<T>} A deferred that resolves with the value, or undefined if the key didn't exist.
   *
   * @template T
   */
  get(key) {}

  /**
   * Set a value for a key.
   *
   * @param {string} key The key to set.
   * @param {T} value The string to save.
   * @param {boolean=} opt_replace If an existing item should be replaced
   * @return {!Deferred} A deferred that resolves when the value has been stored.
   *
   * @template T
   */
  set(key, value, opt_replace) {}

  /**
   * Remove a key and its value.
   *
   * @param {string} key The key to remove.
   * @return {!Deferred} A deferred that resolves when the value has been removed.
   */
  remove(key) {}

  /**
   * Clears all values from storage.
   *
   * @return {!Deferred} A deferred that resolves when storage has been cleared.
   */
  clear() {}
}

exports = IAsyncStorage;

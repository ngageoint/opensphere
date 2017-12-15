goog.provide('os.storage.IMechanism');



/**
 * Interface for a storage mechanism that expands on {@link goog.storage.mechanism.IterableMechanism}.
 * @interface
 * @template T
 */
os.storage.IMechanism = function() {};


/**
 * Interface id for use with os.implements.
 * @type {string}
 */
os.storage.IMechanism.ID = 'os.storage.IMechanism';


/**
 * Get the value stored under a key.
 *
 * @param {string} key The key to get.
 * @return {?string} The corresponding value, null if not found.
 */
os.storage.IMechanism.prototype.get = goog.abstractMethod;


/**
 * Get all items in storage.
 * @return {!Array<T>}
 */
os.storage.IMechanism.prototype.getAll;


/**
 * Get the number of stored key-value pairs.
 *
 * Could be overridden in a subclass, as the default implementation is not very
 * efficient - it iterates over all keys.
 *
 * @return {number} Number of stored elements.
 */
os.storage.IMechanism.prototype.getCount;


/**
 * Remove all key-value pairs.
 *
 * Could be overridden in a subclass, as the default implementation is not very
 * efficient - it iterates over all keys.
 */
os.storage.IMechanism.prototype.clear;


/**
 * Set a value for a key.
 *
 * @param {string} key The key to set.
 * @param {string} value The string to save.
 */
os.storage.IMechanism.prototype.set = goog.abstractMethod;


/**
 * Remove a key and its value.
 *
 * @param {string} key The key to remove.
 */
os.storage.IMechanism.prototype.remove = goog.abstractMethod;

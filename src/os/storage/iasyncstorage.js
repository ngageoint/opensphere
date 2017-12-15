goog.provide('os.storage.IAsyncStorage');
goog.require('goog.async.Deferred');



/**
 * Interface for asynchronous storage mechanisms
 * @interface
 * @template T
 */
os.storage.IAsyncStorage = function() {};


/**
 * Initialize storage
 * @return {!goog.async.Deferred}
 */
os.storage.IAsyncStorage.prototype.init;


/**
 * Get the value stored under a key.
 *
 * @param {string} key The key to get.
 * @return {!goog.async.Deferred<T>} A deferred that resolves with the value, or undefined if the key didn't exist.
 *
 * @template T
 */
os.storage.IAsyncStorage.prototype.get;


/**
 * Set a value for a key.
 *
 * @param {string} key The key to set.
 * @param {T} value The string to save.
 * @param {boolean=} opt_replace If an existing item should be replaced
 * @return {!goog.async.Deferred} A deferred that resolves when the value has been stored.
 *
 * @template T
 */
os.storage.IAsyncStorage.prototype.set;


/**
 * Remove a key and its value.
 *
 * @param {string} key The key to remove.
 * @return {!goog.async.Deferred} A deferred that resolves when the value has been removed.
 */
os.storage.IAsyncStorage.prototype.remove;


/**
 * Clears all values from storage.
 *
 * @return {!goog.async.Deferred} A deferred that resolves when storage has been cleared.
 */
os.storage.IAsyncStorage.prototype.clear;

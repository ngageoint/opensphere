/**
 * @fileoverview Abstract interface for asynchonously storing and retrieving data using some persistence mechanism.
 */

goog.provide('os.storage.AsyncStorage');
goog.require('goog.Disposable');
goog.require('os.storage.IAsyncStorage');



/**
 * Basic interface for all asynchronous storage mechanisms.
 *
 * @abstract
 * @implements {os.storage.IAsyncStorage}
 * @extends {goog.Disposable}
 * @constructor
 * @template T
 */
os.storage.AsyncStorage = function() {
  os.storage.AsyncStorage.base(this, 'constructor');
};
goog.inherits(os.storage.AsyncStorage, goog.Disposable);


/**
 * @abstract
 * @inheritDoc
 * @see {os.storage.IAsyncStorage}
 */
os.storage.AsyncStorage.prototype.init = function() {};


/**
 * @abstract
 * @inheritDoc
 * @see {os.storage.IAsyncStorage}
 */
os.storage.AsyncStorage.prototype.get = function(key) {};


/**
 * Get all values from storage.
 *
 * @abstract
 * @return {!goog.async.Deferred<!Array<T>>} A deferred that resolves with all values in storage.
 * @template T
 */
os.storage.AsyncStorage.prototype.getAll = function() {};


/**
 * @abstract
 * @inheritDoc
 */
os.storage.AsyncStorage.prototype.set = function(key, value, opt_replace) {};


/**
 * @abstract
 * @inheritDoc
 * @see {os.storage.IAsyncStorage}
 */
os.storage.AsyncStorage.prototype.remove = function(key) {};


/**
 * @abstract
 * @inheritDoc
 * @see {os.storage.IAsyncStorage}
 */
os.storage.AsyncStorage.prototype.clear = function() {};

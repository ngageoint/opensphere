/**
 * @fileoverview Abstract interface for asynchonously storing and retrieving data using some persistence mechanism.
 */
goog.module('os.storage.AsyncStorage');
goog.module.declareLegacyNamespace();

const Disposable = goog.require('goog.Disposable');
const IAsyncStorage = goog.require('os.storage.IAsyncStorage'); // eslint-disable-line

const Deferred = goog.requireType('goog.async.Deferred');


/**
 * Basic interface for all asynchronous storage mechanisms.
 *
 * @abstract
 * @implements {IAsyncStorage}
 * @template T
 */
class AsyncStorage extends Disposable {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * Get all values from storage.
   *
   * @abstract
   * @return {!Deferred<!Array<T>>} A deferred that resolves with all values in storage.
   * @template T
   */
  getAll() {}
}

exports = AsyncStorage;

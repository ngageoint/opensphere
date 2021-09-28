/**
 * @fileoverview Abstract interface for asynchonously storing and retrieving data using some persistence mechanism.
 */
goog.declareModuleId('os.storage.AsyncStorage');

import IAsyncStorage from './iasyncstorage.js';// eslint-disable-line

const Disposable = goog.require('goog.Disposable');

const Deferred = goog.requireType('goog.async.Deferred');


/**
 * Basic interface for all asynchronous storage mechanisms.
 *
 * @abstract
 * @implements {IAsyncStorage}
 * @template T
 */
export default class AsyncStorage extends Disposable {
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

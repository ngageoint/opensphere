/**
 * @fileoverview Mechanism for storing and retrieving data using a local object cache.
 */
goog.declareModuleId('os.storage.ObjectMechanism');

import osImplements from '../implements.js';
import IMechanism from './imechanism.js';

const {ShimIterable} = goog.require('goog.iter.es6');
const IterableMechanism = goog.require('goog.storage.mechanism.IterableMechanism');


/**
 * Basic interface for all asynchronous storage mechanisms.
 *
 * @implements {IMechanism<T>}
 * @template T
 */
export default class ObjectMechanism extends IterableMechanism {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The storage cache.
     * @type {!Object<string, T>}
     * @private
     */
    this.storage_ = {};
  }

  /**
   * @inheritDoc
   */
  set(key, value) {
    this.storage_[key] = value;
  }

  /**
   * @return {T}
   * @override
   */
  get(key) {
    return this.storage_[key];
  }

  /**
   * @inheritDoc
   */
  getAll() {
    return Object.values(this.storage_);
  }

  /**
   * @inheritDoc
   */
  remove(key) {
    delete this.storage_[key];
  }

  /**
   * @inheritDoc
   */
  getCount() {
    return Object.keys(this.storage_).length;
  }

  /**
   * @inheritDoc
   */
  clear() {
    for (const i in this.storage_) {
      delete this.storage_[i];
    }
  }

  /**
   * @inheritDoc
   */
  __iterator__(opt_keys) {
    return opt_keys ? ShimIterable.of(Object.keys(this.storage_)).toGoog() :
                      ShimIterable.of(Object.values(this.storage_)).toGoog();
  }
}

osImplements(ObjectMechanism, IMechanism.ID);

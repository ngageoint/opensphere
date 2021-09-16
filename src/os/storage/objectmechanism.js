/**
 * @fileoverview Mechanism for storing and retrieving data using a local object cache.
 */
goog.module('os.storage.ObjectMechanism');

const Iterator = goog.require('goog.iter.Iterator');
const StopIteration = goog.require('goog.iter.StopIteration');
const googObject = goog.require('goog.object');
const IterableMechanism = goog.require('goog.storage.mechanism.IterableMechanism');
const osImplements = goog.require('os.implements');
const IMechanism = goog.require('os.storage.IMechanism');


/**
 * Basic interface for all asynchronous storage mechanisms.
 *
 * @implements {IMechanism<T>}
 * @template T
 */
class ObjectMechanism extends IterableMechanism {
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
    return googObject.getValues(this.storage_);
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
    return googObject.getCount(this.storage_);
  }

  /**
   * @inheritDoc
   */
  clear() {
    googObject.clear(this.storage_);
  }

  /**
   * @inheritDoc
   */
  __iterator__(opt_keys) {
    var i = 0;
    var array = opt_keys ? googObject.getKeys(this.storage_) : googObject.getValues(this.storage_);
    var newIter = new Iterator();

    /**
     * Next implementation for iterator
     *
     * @return {*}
     */
    newIter.next = function() {
      if (i >= array.length) {
        throw StopIteration;
      }

      return array[i++];
    };
    return newIter;
  }
}

osImplements(ObjectMechanism, IMechanism.ID);


exports = ObjectMechanism;

/**
 * @fileoverview Mechanism for storing and retrieving data using a local object cache.
 */

goog.provide('os.storage.ObjectMechanism');

goog.require('goog.iter.Iterator');
goog.require('goog.object');
goog.require('goog.storage.mechanism.IterableMechanism');
goog.require('os.implements');
goog.require('os.storage.IMechanism');



/**
 * Basic interface for all asynchronous storage mechanisms.
 * @extends {goog.storage.mechanism.IterableMechanism}
 * @implements {os.storage.IMechanism<T>}
 * @constructor
 * @template T
 */
os.storage.ObjectMechanism = function() {
  os.storage.ObjectMechanism.base(this, 'constructor');

  /**
   * The storage cache.
   * @type {!Object<string, T>}
   * @private
   */
  this.storage_ = {};
};
goog.inherits(os.storage.ObjectMechanism, goog.storage.mechanism.IterableMechanism);
os.implements(os.storage.ObjectMechanism, os.storage.IMechanism.ID);


/**
 * @inheritDoc
 */
os.storage.ObjectMechanism.prototype.set = function(key, value) {
  this.storage_[key] = value;
};


/**
 * @return {T}
 * @override
 */
os.storage.ObjectMechanism.prototype.get = function(key) {
  return this.storage_[key];
};


/**
 * @inheritDoc
 */
os.storage.ObjectMechanism.prototype.getAll = function() {
  return goog.object.getValues(this.storage_);
};


/**
 * @inheritDoc
 */
os.storage.ObjectMechanism.prototype.remove = function(key) {
  delete this.storage_[key];
};


/**
 * @inheritDoc
 */
os.storage.ObjectMechanism.prototype.getCount = function() {
  return goog.object.getCount(this.storage_);
};


/**
 * @inheritDoc
 */
os.storage.ObjectMechanism.prototype.clear = function() {
  goog.object.clear(this.storage_);
};


/**
 * @inheritDoc
 */
os.storage.ObjectMechanism.prototype.__iterator__ = function(opt_keys) {
  var i = 0;
  var array = opt_keys ? goog.object.getKeys(this.storage_) : goog.object.getValues(this.storage_);
  var newIter = new goog.iter.Iterator();

  /**
   * Next implementation for iterator
   * @return {*}
   */
  newIter.next = function() {
    if (i >= array.length) {
      throw goog.iter.StopIteration;
    }

    return array[i++];
  };
  return newIter;
};

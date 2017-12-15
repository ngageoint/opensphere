goog.provide('os.storage.HTML5LocalStorage');

goog.require('goog.iter');
goog.require('goog.storage.mechanism.HTML5LocalStorage');
goog.require('os.implements');
goog.require('os.storage.IMechanism');



/**
 * Provides a storage mechanism that uses HTML5 local storage. Adds {@link os.storage.IMechanism} implementations
 * from the Closure class.
 *
 * @extends {goog.storage.mechanism.HTML5LocalStorage}
 * @implements {os.storage.IMechanism}
 * @constructor
 */
os.storage.HTML5LocalStorage = function() {
  os.storage.HTML5LocalStorage.base(this, 'constructor');
};
goog.inherits(os.storage.HTML5LocalStorage, goog.storage.mechanism.HTML5LocalStorage);
os.implements(os.storage.HTML5LocalStorage, os.storage.IMechanism.ID);


/**
 * @inheritDoc
 */
os.storage.HTML5LocalStorage.prototype.getAll = function() {
  var values = [];
  goog.iter.forEach(this.__iterator__(false), function(value) {
    values.push(value);
  });
  return values;
};

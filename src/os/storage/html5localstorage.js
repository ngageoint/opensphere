goog.module('os.storage.HTML5LocalStorage');

const iter = goog.require('goog.iter');
const googStorageMechanismHtml5LocalStorage = goog.require('goog.storage.mechanism.HTML5LocalStorage');
const osImplements = goog.require('os.implements');
const IMechanism = goog.require('os.storage.IMechanism');


/**
 * Provides a storage mechanism that uses HTML5 local storage. Adds {@link IMechanism} implementations
 * from the Closure class.
 *
 * @implements {IMechanism}
 */
class HTML5LocalStorage extends googStorageMechanismHtml5LocalStorage {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  getAll() {
    var values = [];
    iter.forEach(this.__iterator__(false), function(value) {
      values.push(value);
    });
    return values;
  }
}
osImplements(HTML5LocalStorage, IMechanism.ID);

exports = HTML5LocalStorage;

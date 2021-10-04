goog.declareModuleId('os.storage.HTML5LocalStorage');

import osImplements from '../implements.js';
import IMechanism from './imechanism.js';

const iter = goog.require('goog.iter');
const googStorageMechanismHtml5LocalStorage = goog.require('goog.storage.mechanism.HTML5LocalStorage');


/**
 * Provides a storage mechanism that uses HTML5 local storage. Adds {@link IMechanism} implementations
 * from the Closure class.
 *
 * @implements {IMechanism}
 */
export default class HTML5LocalStorage extends googStorageMechanismHtml5LocalStorage {
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

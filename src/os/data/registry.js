goog.module('os.data.Registry');

const EventTarget = goog.require('goog.events.EventTarget');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');


/**
 * Object wrapper to serve as agnostic manager of objects/arrays/etc.
 *
 * Typically, use os.data.CollectionManager instead if your "value" has an "id" property
 *
 * The key difference here is that a Registry lets you work with key-value pairs like normal; but
 * also supports custom collections made from the value AND an array of optional parameters
 *
 * e.g.
 *   myRegistry.register(key, value, option1, option2, ...);
 * ... which handles additional parameters, versus...
 *   myManager.add({id: key, data: [value, option1, option2, ...])
 * ... which requires intermediary typedefs, special comparators, and extra logic to extract the "value" from
 *     the typedef
 *
 * @template T
 */
class Registry extends EventTarget {
  /**
   */
  constructor() {
    super();

    /**
     * Collection of registered objects
     * @type {!Object<string, T>}
     */
    this.map_ = {};
  }

  /**
   * @inheritDoc
   */
  dispose() {
    this.removeAllListeners('propertychange');

    super.dispose();
  }

  /**
   * Get the entry from this Registry as an array, just as it was registered
   *
   * e.g.
   * myRegistry.register(k, v, opt1, opt2, ...);
   * ...
   * myRegistry.entry(v) >> [k, v, opt1, opt2, ...]
   *
   * @param {string} keyOrValue
   * @return {Array<?>}
   */
  entry(keyOrValue) {
    const key = this.key(keyOrValue);
    return key ? [key, this.map_[key]].flat(2) : null;
  }

  /**
   * Get the entries from this Registry as an array
   * @return {Array<Array<?>>}
   */
  entries() {
    const arr = [];
    for (const entry of Object.entries(this.map_)) {
      arr.push(entry.flat(2));
    }
    return arr;
  }

  /**
   * Get the Value from this Registry
   * @param {string} key
   * @return {T}
   * @template T
   */
  get(key) {
    if (key && this.has(key)) return this.map_[key][0];
    return null;
  }

  /**
   * Looks for an entry in the registry with the matching Key or has the desired Value
   * @param {string|T} keyOrValue
   * @return {boolean} true if this keyOrValue is found
   */
  has(keyOrValue) {
    return (!!this.key(keyOrValue));
  }

  /**
   * Convert a keyOrValue into the Key
   * @param {string|T} keyOrValue
   * @return {string} key if this keyOrValue is found, else null
   * @template T
   */
  key(keyOrValue) {
    // avoid the 'typeof string' comparison if possible by doing a quick lookup
    const has = this.map_.hasOwnProperty('' + keyOrValue);
    let key = has ? keyOrValue : null;

    if (!has && typeof keyOrValue != 'string') {
      const entries = this.entries();
      const entry = entries.find((entry) => {
        return entry[1] == keyOrValue;
      });
      key = entry ? entry[0] : null;
    }

    return key;
  }

  /**
   * Get the keys from this Registry as an array
   * @return {Array<string>}
   */
  keys() {
    return Object.keys(this.map_);
  }

  /**
   * Quick bind to this registry
   * @param {!function(!string)} onAddChange
   * @param {!function(!string)} onRemove
   */
  on(onAddChange, onRemove) {
    // call for all the existing entries...
    this.keys().forEach((key) => {
      onAddChange(key);
    });

    // then listen for changes to and run listeners as needed
    this.listen('propertychange', function(event) {
      switch (event.property_) {
        case 'add':
        case 'change':
          onAddChange(event.newVal_);
          break;
        case 'remove':
          onRemove(event.newVal_);
          break;
        default:
          break;
      }
    });
  }

  /**
   * Add an object to this Registry
   * @param {string} key
   * @param {T} value
   * @param {...} opt
   * @return {boolean} true if prior value overwritten
   * @template T
   */
  register(key, value, ...opt) {
    const had = this.has(key);
    this.map_[key] = [value, opt];
    if (!had) {
      this.dispatchEvent(new PropertyChangeEvent('add', key));
    } else {
      this.dispatchEvent(new PropertyChangeEvent('update', key));
    }
    return had;
  }

  /**
   * Removes an object from the Registry if it exists
   * @param {string} key
   * @return {boolean} true if existed
   */
  remove(key) {
    if (this.has(key)) {
      this.dispatchEvent(new PropertyChangeEvent('remove', key));
      delete this.map_[key];
      return true;
    }
    return false;
  }
}

exports = Registry;

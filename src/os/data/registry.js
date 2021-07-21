goog.module('os.data.Registry');

const EventTarget = goog.require('goog.events.EventTarget');
const {PROPERTYCHANGE} = goog.require('goog.events.EventType');
const RegistryPropertyChange = goog.require('os.data.RegistryPropertyChange');
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
    this.clear();

    this.removeAllListeners(PROPERTYCHANGE);

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
   * @param {!function(!Array<?>)} onAddChange
   * @param {!function(!Array<?>)} onRemove
   * @param {function(!Array<Array<?>>)=} opt_onClear
   * @param {?=} opt_this
   */
  on(onAddChange, onRemove, opt_onClear, opt_this) {
    // call for all the existing entries...
    this.entries().forEach((entry) => {
      if (entry) onAddChange.call(opt_this, entry);
    });

    // then listen for changes to and run listeners as needed
    this.listen(PROPERTYCHANGE, function(event) {
      switch (event.getProperty()) {
        case RegistryPropertyChange.ADD:
        case RegistryPropertyChange.UPDATE:
          onAddChange.call(opt_this, event.newVal_);
          break;
        case RegistryPropertyChange.REMOVE:
          onRemove.call(opt_this, event.newVal_);
          break;
        case RegistryPropertyChange.CLEAR:
          if (opt_onClear) {
            opt_onClear.call(opt_this, event.newVal_);
          } else {
            const entries = event.newVal_;
            if (entries && entries.length > 0) {
              entries.forEach((entry) => {
                onRemove.call(opt_this, entry);
              });
            }
          }
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
    const entry = this.entry(key);
    if (!had) {
      this.dispatchEvent(new PropertyChangeEvent(RegistryPropertyChange.ADD, entry));
    } else {
      this.dispatchEvent(new PropertyChangeEvent(RegistryPropertyChange.UPDATE, entry));
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
      const entry = this.entry(key);
      delete this.map_[key];
      this.dispatchEvent(new PropertyChangeEvent(RegistryPropertyChange.REMOVE, entry));
      return true;
    }
    return false;
  }

  /**
   * Empty out the Registry
   */
  clear() {
    const entries = this.entries();
    this.map_ = /** @type {!Object<string, T>} */ ({});
    this.dispatchEvent(new PropertyChangeEvent(RegistryPropertyChange.CLEAR, entries));
  }
}

exports = Registry;

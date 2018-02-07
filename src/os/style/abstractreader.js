goog.provide('os.style.AbstractReader');
goog.require('ol.structs.LRUCache');
goog.require('os.style.IStyleReader');



/**
 * Base implementation of a style configuration reader.
 * @implements {os.style.IStyleReader<T>}
 * @constructor
 * @template T
 */
os.style.AbstractReader = function() {
  /**
   * @type {!Object<string, os.style.IStyleReader>}
   * @protected
   */
  this.readers = {};

  /**
   * The reader's style cache. Styles are cached by a hash generated from all components added to the style. Hashes
   * should always be the same type (number) for JS engine optimization purposes.
   * @type {Object<number, T>}
   * @protected
   */
  this.cache = {};

  /**
   * A hash of 0 is reserved for an undefined config, so make sure all styles have a hash of at least 1.
   * @type {number}
   * @protected
   */
  this.baseHash = 1;
};


/**
 * @inheritDoc
 */
os.style.AbstractReader.prototype.getOrCreateStyle = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.style.AbstractReader.prototype.setReaders = function(readers) {
  this.readers = readers;
};


/**
 * @inheritDoc
 */
os.style.AbstractReader.prototype.toConfig = function(style, obj) {
  // intentionally empty
};

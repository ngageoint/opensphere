goog.module('os.style.AbstractReader');
goog.module.declareLegacyNamespace();

const IStyleReader = goog.require('os.style.IStyleReader'); // eslint-disable-line


/**
 * Base implementation of a style configuration reader.
 *
 * @abstract
 * @implements {IStyleReader<T>}
 * @template T
 */
class AbstractReader {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {!Object<string, IStyleReader>}
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
  }

  /**
   * @abstract
   * @inheritDoc
   */
  getOrCreateStyle(config) {}

  /**
   * @inheritDoc
   */
  setReaders(readers) {
    this.readers = readers;
  }

  /**
   * @inheritDoc
   */
  toConfig(style, obj) {
    // intentionally empty
  }
}

exports = AbstractReader;

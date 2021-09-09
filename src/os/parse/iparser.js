goog.module('os.parse.IParser');


/**
 * A simple interface for describing a parser.
 *
 * @template T
 * @interface
 */
class IParser {
  /**
   * @return {boolean} If there is another item to os.parse.
   */
  hasNext() {}

  /**
   * Parse the next item in the source.
   * @return {T|Array<T>} The next item(s).
   */
  parseNext() {}

  /**
   * Sets the source object to be parsed.
   * @param {Object|string|Node|Document} source The data source to os.parse.
   */
  setSource(source) {}

  /**
   * Cleans up and resets
   */
  cleanup() {}
}

exports = IParser;

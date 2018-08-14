goog.provide('os.parse.IParser');



/**
 * A simple interface for describing a parser.
 * @template T
 * @interface
 */
os.parse.IParser = function() {};


/**
 * @return {boolean} If there is another item to os.parse.
 */
os.parse.IParser.prototype.hasNext;


/**
 * Parse the next item in the source.
 * @return {T|Array<T>} The next item(s).
 */
os.parse.IParser.prototype.parseNext;


/**
 * Sets the source object to be parsed.
 * @param {Object|string|Node|Document} source The data source to os.parse.
 */
os.parse.IParser.prototype.setSource;


/**
 * Cleans up and resets
 */
os.parse.IParser.prototype.cleanup;

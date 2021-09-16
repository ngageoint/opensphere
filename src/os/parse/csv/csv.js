goog.module('os.parse.csv');


/**
 * @type {string}
 */
const DEFAULT_COMMENT_CHAR = '#';

/**
 * @type {string}
 */
const DEFAULT_DELIMITER = ',';

/**
 * All possible  comment character values accepted by the CSV parser. PapaParse only uses single characters,
 * so '//' was not included.
 * @type {Object<string, (string|boolean)>}
 * @todo Add custom character support.
 */
const COMMENT_CHARS = {
  'Dollar Sign ($)': '$',
  'Exclamation (!)': '!',
  'Hash (#)': '#',
  'Percent (%)': '%',
  'None': false
};

/**
 * All possible delimiter values accepted by the CSV parser.
 * @type {Object<string, string>}
 * @todo Add custom delimiter support.
 */
const DELIMITERS = {
  'Backslash (\\)': '\\',
  'Colon (:)': ':',
  'Comma (,)': ',',
  'Pipe (|)': '|',
  'Semi-Colon (;)': ';',
  'Slash (/)': '/',
  'Space ( )': ' ',
  'Tab (->)': '\t'
};

exports = {
  DEFAULT_COMMENT_CHAR,
  DEFAULT_DELIMITER,
  COMMENT_CHARS,
  DELIMITERS
};

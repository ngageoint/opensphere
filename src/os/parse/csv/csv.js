goog.declareModuleId('os.parse.csv');

/**
 * @type {string}
 */
export const DEFAULT_COMMENT_CHAR = '#';

/**
 * @type {string}
 */
export const DEFAULT_DELIMITER = ',';

/**
 * All possible  comment character values accepted by the CSV parser. PapaParse only uses single characters,
 * so '//' was not included.
 * @type {Object<string, (string|boolean)>}
 * @todo Add custom character support.
 */
export const COMMENT_CHARS = {
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
export const DELIMITERS = {
  'Backslash (\\)': '\\',
  'Colon (:)': ':',
  'Comma (,)': ',',
  'Pipe (|)': '|',
  'Semi-Colon (;)': ';',
  'Slash (/)': '/',
  'Space ( )': ' ',
  'Tab (->)': '\t'
};

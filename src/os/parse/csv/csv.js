goog.provide('os.parse.csv');


/**
 * @type {string}
 * @const
 */
os.parse.csv.DEFAULT_COMMENT_CHAR = '#';


/**
 * @type {string}
 * @const
 */
os.parse.csv.DEFAULT_DELIMITER = ',';


/**
 * All possible  comment character values accepted by the CSV parser. PapaParse only uses single characters,
 * so '//' was not included.
 * @type {Object.<string, (string|boolean)>}
 * @const
 * @todo Add custom character support.
 */
os.parse.csv.COMMENT_CHARS = {
  'Dollar Sign ($)': '$',
  'Exclamation (!)': '!',
  'Hash (#)': '#',
  'Percent (%)': '%',
  'None': false
};


/**
 * All possible delimiter values accepted by the CSV parser.
 * @type {Object.<string, string>}
 * @const
 * @todo Add custom delimiter support.
 */
os.parse.csv.DELIMITERS = {
  'Backslash (\\)': '\\',
  'Colon (:)': ':',
  'Comma (,)': ',',
  'Pipe (|)': '|',
  'Semi-Colon (;)': ';',
  'Slash (/)': '/',
  'Space ( )': ' ',
  'Tab (->)': '\t'
};

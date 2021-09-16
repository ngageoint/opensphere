goog.module('os.ui.filter.FilterPatterns');

/**
 * Enum of validation regexes for different logical column types.
 * @type {Object<string, RegExp>}
 */
exports = {
  'string': /.*/,
  'text': /.*/,
  'decimal': /^\-?\d+((\.|\,)\d+)?$/,
  'integer': /^\-?\d+$/,
  'real': /^\-?\d+((\.|\,)\d+)?$/,
  'recordtime': /^\-?\d+((\.|\,)\d+)?$/
};

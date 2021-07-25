goog.module('os.ui.filter.FilterPatterns');
goog.module.declareLegacyNamespace();

/**
 * Enum of validation regexes for different logical column types.
 * @type {Object<string, RegExp>}
 */
exports = {
  'string': /.*/,
  'decimal': /^\-?\d+((\.|\,)\d+)?$/,
  'integer': /^\-?\d+$/,
  'recordtime': /^\-?\d+((\.|\,)\d+)?$/
};

goog.provide('os.ui.filter.string');


/**
 * Escape a value for use in a filter string and wrap it in double quotes.
 * @param {*} s The value. If not a string, it will be casted to one.
 * @return {string} A double quoted, escaped copy of {@code s}.
 */
os.ui.filter.string.quoteString = function(s) {
  // this will both escape double quotes and backslashes, and wrap in double quotes
  return JSON.stringify(String(s));
};


/**
 * Escape a value for use in a double quoted filter string.
 * @param {*} s The value. If not a string, it will be casted to one.
 * @return {string} An escaped copy of {@code s}.
 */
os.ui.filter.string.escapeString = function(s) {
  // escape double quotes and backslashes, for use in an evaluated double quoted string
  return String(s).replace(/([\\"])/g, '\\$1');
};


/**
 * Escape a value for use in a filter string RegExp.
 * @param {*} s The value. If not a string, it will be casted to one.
 * @param {string=} opt_wildcard The wildcard character. Defaults to '*'.
 * @param {string=} opt_singleChar The single wildcard character. Defaults to '.'.
 * @return {string} A RegExp-safe, escaped copy of {@code s}.
 */
os.ui.filter.string.escapeRegExp = function(s, opt_wildcard, opt_singleChar) {
  // escape all RegExp characters that won't be used by the filter
  var result = String(s)
      .replace(/([-()\[\]{}+?$\^|,:#<!\\])/g, '\\$1')
      .replace(/\x08/g, '\\x08');

  var singleChar = opt_singleChar || '.';
  var wildcard = opt_wildcard || '*';

  if (singleChar != '.') {
    // single char isn't '.', so escape them in the expression
    result = result.replace(/\./g, '\\.');

    // if they're the same, skip this in favor of the wildcard replace
    if (singleChar != wildcard) {
      // replace single wildcard chars with '.' for use in a RegExp
      var singleRe = new RegExp(goog.string.regExpEscape(singleChar), 'g');
      result = result.replace(singleRe, '.');
    }
  }

  if (wildcard != '*') {
    // wildcard isn't '*', so escape them in the expression
    result = result.replace(/\*/g, '\\*');
  }

  // replace wildcard chars with '.*' for use in a RegExp
  var wildcardRe = new RegExp(goog.string.regExpEscape(wildcard), 'g');
  result = result.replace(wildcardRe, '.*');

  return result;
};

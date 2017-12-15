goog.require('os.ui.filter.string');

describe('os.ui.filter.string', function() {
  it('should escape double quotes and backslashes in strings', function() {
    // nothing to escape
    expect(os.ui.filter.string.escapeString('value')).toBe('value');

    // escapes double quotes
    expect(os.ui.filter.string.escapeString('"value"')).toBe('\\"value\\"');

    // escapes backslashes
    expect(os.ui.filter.string.escapeString('\\value\\')).toBe('\\\\value\\\\');

    // escapes backslashes/double quotes
    expect(os.ui.filter.string.escapeString('\\"value\\"')).toBe('\\\\\\"value\\\\\\"');
  });

  it('should escape and double quotes strings', function() {
    // nothing to escape
    expect(os.ui.filter.string.quoteString('value')).toBe('"value"');

    // escapes double quotes
    expect(os.ui.filter.string.quoteString('"value"')).toBe('"\\"value\\""');

    // escapes backslashes
    expect(os.ui.filter.string.quoteString('\\value\\')).toBe('"\\\\value\\\\"');

    // escapes backslashes/double quotes
    expect(os.ui.filter.string.quoteString('\\"value\\"')).toBe('"\\\\\\"value\\\\\\""');
  });

  it('should escape characters for regular expressions used to evaluate a filter', function() {
    // nothing to escape
    expect(os.ui.filter.string.escapeRegExp('value')).toBe('value');

    // escapes regular expression characters
    expect(os.ui.filter.string.escapeRegExp('-()[]{}+?$^|,:#<!\\'))
        .toBe('\\-\\(\\)\\[\\]\\{\\}\\+\\?\\$\\^\\|\\,\\:\\#\\<\\!\\\\');

    // default wildcard is *
    expect(os.ui.filter.string.escapeRegExp('value*')).toBe('value.*');
    expect(os.ui.filter.string.escapeRegExp('*value*')).toBe('.*value.*');

    // wildcard override escapes *, converts override to .*
    expect(os.ui.filter.string.escapeRegExp('*value*', '%')).toBe('\\*value\\*');
    expect(os.ui.filter.string.escapeRegExp('%*value*%', '%')).toBe('.*\\*value\\*.*');

    // single wildcard characters
    expect(os.ui.filter.string.escapeRegExp('value.')).toBe('value.');
    expect(os.ui.filter.string.escapeRegExp('..value..')).toBe('..value..');

    // single wildcard override escapes ., converts override to .
    expect(os.ui.filter.string.escapeRegExp('value.', undefined, '%')).toBe('value\\.');
    expect(os.ui.filter.string.escapeRegExp('value.%%', undefined, '%')).toBe('value\\...');

    // same single/multiple wildcard escapes ., replaces wildcard with .*
    expect(os.ui.filter.string.escapeRegExp('%.value.%', '%', '%')).toBe('.*\\.value\\..*');
  });
});

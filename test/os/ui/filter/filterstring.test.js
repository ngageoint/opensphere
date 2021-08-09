goog.require('os.ui.filter.string');

describe('os.ui.filter.string', function() {
  const osUiFilterString = goog.module.get('os.ui.filter.string');

  it('should escape double quotes and backslashes in strings', function() {
    // nothing to escape
    expect(osUiFilterString.escapeString('value')).toBe('value');

    // escapes double quotes
    expect(osUiFilterString.escapeString('"value"')).toBe('\\"value\\"');

    // escapes backslashes
    expect(osUiFilterString.escapeString('\\value\\')).toBe('\\\\value\\\\');

    // escapes backslashes/double quotes
    expect(osUiFilterString.escapeString('\\"value\\"')).toBe('\\\\\\"value\\\\\\"');
  });

  it('should escape and double quotes strings', function() {
    // nothing to escape
    expect(osUiFilterString.quoteString('value')).toBe('"value"');

    // escapes double quotes
    expect(osUiFilterString.quoteString('"value"')).toBe('"\\"value\\""');

    // escapes backslashes
    expect(osUiFilterString.quoteString('\\value\\')).toBe('"\\\\value\\\\"');

    // escapes backslashes/double quotes
    expect(osUiFilterString.quoteString('\\"value\\"')).toBe('"\\\\\\"value\\\\\\""');
  });

  it('should escape characters for regular expressions used to evaluate a filter', function() {
    // nothing to escape
    expect(osUiFilterString.escapeRegExp('value')).toBe('value');

    // escapes regular expression characters
    expect(osUiFilterString.escapeRegExp('-()/[]{}+?$^|,:#<!\\'))
        .toBe('\\-\\(\\)\\/\\[\\]\\{\\}\\+\\?\\$\\^\\|\\,\\:\\#\\<\\!\\\\');

    // default wildcard is *
    expect(osUiFilterString.escapeRegExp('value*')).toBe('value.*');
    expect(osUiFilterString.escapeRegExp('*value*')).toBe('.*value.*');

    // wildcard override escapes *, converts override to .*
    expect(osUiFilterString.escapeRegExp('*value*', '%')).toBe('\\*value\\*');
    expect(osUiFilterString.escapeRegExp('%*value*%', '%')).toBe('.*\\*value\\*.*');

    // single wildcard characters
    expect(osUiFilterString.escapeRegExp('value.')).toBe('value.');
    expect(osUiFilterString.escapeRegExp('..value..')).toBe('..value..');

    // single wildcard override escapes ., converts override to .
    expect(osUiFilterString.escapeRegExp('value.', undefined, '%')).toBe('value\\.');
    expect(osUiFilterString.escapeRegExp('value.%%', undefined, '%')).toBe('value\\...');

    // same single/multiple wildcard escapes ., replaces wildcard with .*
    expect(osUiFilterString.escapeRegExp('%.value.%', '%', '%')).toBe('.*\\.value\\..*');
  });
});

goog.require('os.filter.FilterEntry');
goog.require('os.filter.impl.ecql.FilterFormatter');

describe('os.filter.impl.ecql.FilterFormatter', function() {
  var filters = [
      '<PropertyIsEqualTo><PropertyName>boolField</PropertyName><Literal>true</Literal></PropertyIsEqualTo>',
      '<PropertyIsNotEqualTo><PropertyName>numField</PropertyName><Literal>5</Literal></PropertyIsNotEqualTo>',
      '<PropertyIsGreaterThan><PropertyName>stringField</PropertyName><Literal>ABC</Literal></PropertyIsGreaterThan>',
      '<PropertyIsGreaterThanOrEqualTo><PropertyName>stringField</PropertyName><Literal>XYZ</Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>',
      '<PropertyIsLessThan><PropertyName>numField</PropertyName><Literal>100</Literal></PropertyIsLessThan>',
      '<PropertyIsLessThanOrEqualTo><PropertyName>numField</PropertyName><Literal>50</Literal>' +
        '</PropertyIsLessThanOrEqualTo>',
      '<PropertyIsLike><PropertyName>stringField</PropertyName><Literal>A*</Literal></PropertyIsLike>',
      '<PropertyIsNotLike><PropertyName>stringField</PropertyName><Literal>b*</Literal></PropertyIsNotLike>',
      '<PropertyIsNull><PropertyName>stringField</PropertyName></PropertyIsNull>',
      '<PropertyIsNotNull><PropertyName>numField</PropertyName></PropertyIsNotNull>'];

  var expected = [
      '(boolField = TRUE)',
      '(numField <> 5)',
      '(stringField > \'ABC\')',
      '(stringField >= \'XYZ\')',
      '(numField < 100)',
      '(numField <= 50)',
      '(stringField ILIKE \'A%\')',
      '(stringField NOT ILIKE \'b%\')',
      '(stringField IS NULL)',
      '(numField IS NOT NULL)'];

  it('should format filters', function() {
    var formatter = new os.filter.impl.ecql.FilterFormatter();
    expect(filters.length).toBe(expected.length);

    for (var i = 0, n = filters.length; i < n; i++) {
      var entry = new os.filter.FilterEntry();
      entry.setFilter(filters[i]);
      expect(formatter.format(entry)).toBe(expected[i]);
    }
  });

  it ('should format groups properly', function() {
    var filter = '<Or><And>' +
        filters[1] + filters[5] +
        '</And><Or>' +
        filters[2] + filters[8] +
        '</Or><Not>' + filters[0] + '</Not></Or>';

    var formatter = new os.filter.impl.ecql.FilterFormatter();
    var entry = new os.filter.FilterEntry();
    entry.setFilter(filter);

    expect(formatter.format(entry)).toBe(
        '((' + expected[1] + ' AND ' + expected[5] + ') OR ' +
        '(' + expected[2] + ' OR ' + expected[8] + ') OR ' +
        '(NOT ' + expected[0] + '))');
  });

  it('should properly handle parens in literals', function() {
    var filter = '<And>' + filters[1] +
      '<PropertyIsEqualTo><PropertyName>stringField</PropertyName><Literal>(parenthetical comment)</Literal>' +
      '</PropertyIsEqualTo></And>';


    var formatter = new os.filter.impl.ecql.FilterFormatter();
    var entry = new os.filter.FilterEntry();
    entry.setFilter(filter);

    var result = formatter.format(entry);
    expect(result).toBe(
        '(' + expected[1] + ' AND (stringField = \'{openParen}parenthetical comment{closeParen}\'))');
  });
});

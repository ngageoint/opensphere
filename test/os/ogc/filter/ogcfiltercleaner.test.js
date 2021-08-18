goog.require('os.ogc.filter.OGCFilterCleaner');

describe('os.ogc.filter.OGCFilterCleaner', function() {
  const OGCFilterCleaner = goog.module.get('os.ogc.filter.OGCFilterCleaner');

  it('should clean filters', function() {
    var dirty = '<filter>' +
      '<And>' +
        '<Or>' +
          '<Not></Not>' +
        '</Or>' +
        '<Not>' +
          '<SomeExpr></SomeExpr>' +
        '</Not>' +
        '<Or>' +
          '<SingleExpr></SingleExpr>' +
        '</Or>' +
        '<Or>' +
          '<MultiExpr></MultiExpr>' +
          '<MultiExpr></MultiExpr>' +
        '</Or>' +
      '</And></filter>';

    var expected = '<filter>' +
      '<And>' +
        '<Not>' +
          '<SomeExpr/>' +
        '</Not>' +
        '<Or>' +
          '<MultiExpr/>' +
          '<MultiExpr/>' +
        '</Or>' +
        '<SingleExpr/>' +
      '</And></filter>';


    var result = OGCFilterCleaner.cleanFilter(dirty);
    expect(result).toBe(expected);
  });
});

goog.require('os.ui.filter.op.EqualTo');
goog.require('os.ui.filter.op.IsLike');
goog.require('os.ui.filter.op.IsNull');
goog.require('os.ui.filter.op.Not');
goog.require('os.ui.filter.op.Op');


describe('os.ui.filter.op.Not', function() {
  var defaultOp = new os.ui.filter.op.Op();
  var notDefaultOp = new os.ui.filter.op.Not(defaultOp);

  var equal = new os.ui.filter.op.EqualTo();
  var notEqual = new os.ui.filter.op.Not(equal);

  var empty = new os.ui.filter.op.IsNull();
  var notEmpty = new os.ui.filter.op.Not(empty);

  var like = new os.ui.filter.op.IsLike();
  var notLike = new os.ui.filter.op.Not(like);

  it('should return the correct title', function() {
    // replaces "is" with "is not"
    expect(notEqual.getTitle()).toBe('is not equal to');
    expect(notEmpty.getTitle()).toBe('is not empty');

    // prepends "not"
    expect(notEqual.getShortTitle()).toBe('not ='); // there is a reason this has its own class...
    expect(notEmpty.getShortTitle()).toBe('not empty');
  });

  it('should properly extract the column', function() {
    var filter = '<Not><MattersNot><PropertyName>KEY</PropertyName><Literal>abc</Literal></MattersNot></Not>';
    var el = $($.parseXML(filter).firstChild);

    // samesies
    expect(notEqual.getColumn(el)).toBe('KEY');
    expect(notEmpty.getColumn(el)).toBe('KEY');
  });

  it('should properly extract the literal', function() {
    var filter = '<Not><MattersNot><PropertyName>KEY</PropertyName><Literal>abc</Literal></MattersNot></Not>';
    var el = $($.parseXML(filter).firstChild);

    // EqualTo supports literals
    expect(notEqual.getLiteral(el)).toBe('abc');

    // IsNull does not
    expect(notEmpty.getLiteral(el)).toBe(null);
  });

  it('should properly match against XML', function() {
    var filter = '<Not><PropertyIsEqualTo>' +
        '<PropertyName>KEY</PropertyName>' +
        '<Literal>value</Literal>' +
        '</PropertyIsEqualTo></Not>';
    var el = $($.parseXML(filter).firstChild);

    expect(notEqual.matches(el)).toBe(true);
    expect(equal.matches(el)).toBe(false);

    filter = '<Not><PropertyIsNull><PropertyName>KEY</PropertyName></PropertyIsNull></Not>';
    el = $($.parseXML(filter).firstChild);

    expect(notEmpty.matches(el)).toBe(true);
    expect(empty.matches(el)).toBe(false);
  });

  it('should properly report whether it supports a column type', function() {
    expect(notEqual.isSupported('string')).toBe(true);
    expect(notEqual.isSupported('integer')).toBe(true);
    expect(notEmpty.isSupported('string')).toBe(true);
    expect(notEmpty.isSupported('integer')).toBe(true);
    expect(notLike.isSupported('string')).toBe(true);
    expect(notLike.isSupported('integer')).toBe(false);
  });

  it('should generate the proper filter', function() {
    var expected = '<PropertyIsNull><PropertyName>KEY</PropertyName></PropertyIsNull>';
    var emptyFilter = empty.getFilter('KEY');
    expect(emptyFilter).toBe(expected);

    expected = '<Not>' + emptyFilter + '</Not>';
    expect(notEmpty.getFilter('KEY')).toBe(expected);
  });

  it('should generate the proper filter function expression', function() {
    var equalExpr = equal.getEvalExpression('testVar', 'testVal');
    var notEqualExpr = notEqual.getEvalExpression('testVar', 'testVal');
    expect(notEqualExpr).toBe('!(' + equalExpr + ')');

    var testVar = 'testVal';

    // prevent eslint no-unused-vars
    expect(testVar).toBeDefined();

    expect(eval(equalExpr)).toBe(true);
    expect(eval(notEqualExpr)).toBe(false);

    testVar = 'otherVal';
    expect(eval(equalExpr)).toBe(false);
    expect(eval(notEqualExpr)).toBe(true);

    var emptyExpr = empty.getEvalExpression('testVar', 'testVal');
    var notEmptyExpr = notEmpty.getEvalExpression('testVar', 'testVal');
    expect(notEmptyExpr).toBe('!(' + emptyExpr + ')');

    testVar = null;
    expect(eval(emptyExpr)).toBe(true);
    expect(eval(notEmptyExpr)).toBe(false);

    var likeExpr = like.getEvalExpression('testVar', 'testV*');
    var notLikeExpr = notLike.getEvalExpression('testVar', 'testV*');
    expect(notLikeExpr).toBe('!(' + likeExpr + ')');

    testVar = 'testVal';
    expect(eval(likeExpr)).toBe(true);
    expect(eval(notLikeExpr)).toBe(false);

    testVar = 'otherVal';
    expect(eval(likeExpr)).toBe(false);
    expect(eval(notLikeExpr)).toBe(true);
  });

  it('should not generate a filter function expression if op doesnt', function() {
    // doesn't return an expression if the literal is null/empty
    expect(notDefaultOp.getEvalExpression('thisIsntUsed', 'neitherIsThis')).toBe('');
  });
});

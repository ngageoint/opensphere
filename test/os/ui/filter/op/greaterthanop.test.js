goog.require('os.ui.filter.op.GreaterThan');

describe('os.ui.filter.op.GreaterThan', function() {
  var op = new os.ui.filter.op.GreaterThan();

  it('should be configured correctly', function() {
    expect(op.localName).toBe('PropertyIsGreaterThan');
    expect(op.supportedTypes).toBeNull();

    expect(op.getTitle()).toBe('is greater than');
    expect(op.getShortTitle()).toBe('>');
    expect(op.getUi()).toBe('fb-text');
  });

  it('should generate the proper filter function expression', function() {
    var expr = op.getEvalExpression('testVar', 10);
    expect(expr).toBe('testVar>"10"');

    var testVar = 100;

    // prevent eslint no-unused-vars
    expect(testVar).toBeDefined();

    // test value greater
    expect(eval(expr)).toBe(true);

    // test value less
    testVar = 0;
    expect(eval(expr)).toBe(false);

    // test value equal
    testVar = 10;
    expect(eval(expr)).toBe(false);

    // test string literals, since they're technically supported
    expr = op.getEvalExpression('testVar', 'b');
    expect(expr).toBe('testVar>"b"');

    // test value less
    testVar = 'a';
    expect(eval(expr)).toBe(false);

    // test value equal
    testVar = 'b';
    expect(eval(expr)).toBe(false);

    // test value greater
    testVar = 'c';
    expect(eval(expr)).toBe(true);
  });

  it('should not generate a filter function expression if the literal is invalid', function() {
    // doesn't return an expression if the literal is null/empty
    expect(op.getEvalExpression('testVar', null)).toBe('');
    expect(op.getEvalExpression('testVar', '')).toBe('');
    expect(op.getEvalExpression('testVar', '   ')).toBe('');
  });
});

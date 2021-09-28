goog.require('os.ui.filter.op.IsLike');

describe('os.ui.filter.op.IsLike', function() {
  const {default: IsLike} = goog.module.get('os.ui.filter.op.IsLike');

  var op = new IsLike();

  it('should be configured correctly', function() {
    expect(op.localName).toBe('PropertyIsLike');
    expect(op.supportedTypes).toBeDefined();
    expect(op.supportedTypes.length).toBe(1);
    expect(op.supportedTypes).toContain('string');

    expect(op.getTitle()).toBe('is like');
    expect(op.getShortTitle()).toBe('like');
    expect(op.getUi()).toBe('fb-text');
    expect(op.getAttributes()).toBe('wildCard="*" singleChar="." escape="\\"');
  });

  it('should generate the proper filter function expression', function() {
    // one wildcard
    var expr = op.getEvalExpression('testVar', 'testV*');
    expect(expr).toBe('/^testV.*$/im.test(testVar)');

    var testVar = 'testVal'; // eslint-disable-line

    expect(eval(expr)).toBe(true);

    testVar = 'testval';
    expect(eval(expr)).toBe(true);

    testVar = 'otherVal';
    expect(eval(expr)).toBe(false);

    // multiple wildcards
    expr = op.getEvalExpression('testVar', '*V*');
    expect(expr).toBe('/^.*V.*$/im.test(testVar)');

    testVar = 'testVal';
    expect(eval(expr)).toBe(true);

    testVar = 'testval';
    expect(eval(expr)).toBe(true);

    testVar = 'otherVal';
    expect(eval(expr)).toBe(true);

    testVar = 'noMatch';
    expect(eval(expr)).toBe(false);

    // single character wildcards
    expr = op.getEvalExpression('testVar', 'f.....uck');
    expect(expr).toBe('/^f.....uck$/im.test(testVar)');

    testVar = 'firetruck';
    expect(eval(expr)).toBe(true);

    testVar = 'fireytruck';
    expect(eval(expr)).toBe(false);

    testVar = 'fireTruck';
    expect(eval(expr)).toBe(true);

    testVar = 'firetrucks';
    expect(eval(expr)).toBe(false);

    testVar = 'fruck';
    expect(eval(expr)).toBe(false);

    // special RegExp characters
    expr = op.getEvalExpression('testVar', 'ABCD-1234');
    expect(expr).toBe('/^ABCD\\-1234$/im.test(testVar)');

    testVar = 'ABCD-1234';
    expect(eval(expr)).toBe(true);

    testVar = 'BCD-123';
    expect(eval(expr)).toBe(false);

    // special RegExp characters with wildcards
    expr = op.getEvalExpression('testVar', 'ABCD-12*');
    expect(expr).toBe('/^ABCD\\-12.*$/im.test(testVar)');

    testVar = 'ABCD-1234';
    expect(eval(expr)).toBe(true);

    testVar = 'ABCD-1243';
    expect(eval(expr)).toBe(true);

    testVar = 'BCD-1234';
    expect(eval(expr)).toBe(false);
  });

  it('should not generate a filter function expression if the literal is invalid', function() {
    // doesn't return an expression if the literal is null/empty
    expect(op.getEvalExpression('testVar', null)).toBe('');
    expect(op.getEvalExpression('testVar', '')).toBe('');
    expect(op.getEvalExpression('testVar', '   ')).toBe('');
  });

  it('should match multi-line strings', function() {
    var expr = op.getEvalExpression('testVar', '*testV*');
    expect(expr).toBe('/^.*testV.*$/im.test(testVar)');

    var testVar = 'this text does not match\nbut this does match testVal'; // eslint-disable-line

    expect(eval(expr)).toBe(true);
  });
});

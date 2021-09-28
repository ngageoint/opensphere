goog.require('os.ui.filter.op.IsLike');
goog.require('os.ui.filter.op.NotLike');

describe('os.ui.filter.op.NotLike', function() {
  const {default: IsLike} = goog.module.get('os.ui.filter.op.IsLike');
  const {default: NotLike} = goog.module.get('os.ui.filter.op.NotLike');

  var op = new NotLike();
  var innerOp = op.op;

  it('should be configured correctly', function() {
    expect(innerOp instanceof IsLike).toBe(true);

    expect(op.getTitle()).toBe('is not like');
    expect(op.getShortTitle()).toBe('not like');
  });

  it('should generate the proper filter function expression', function() {
    // one wildcard
    var expr = op.getEvalExpression('testVar', 'testV*');
    expect(expr).toBe('!(/^testV.*$/im.test(testVar))');

    var testVar = 'testVal'; // eslint-disable-line

    expect(eval(expr)).toBe(false);

    testVar = 'testval';
    expect(eval(expr)).toBe(false);

    testVar = 'otherVal';
    expect(eval(expr)).toBe(true);

    // multiple wildcards
    expr = op.getEvalExpression('testVar', '*V*');
    expect(expr).toBe('!(/^.*V.*$/im.test(testVar))');

    testVar = 'testVal';
    expect(eval(expr)).toBe(false);

    testVar = 'testval';
    expect(eval(expr)).toBe(false);

    testVar = 'otherVal';
    expect(eval(expr)).toBe(false);

    testVar = 'noMatch';
    expect(eval(expr)).toBe(true);

    // single character wildcards
    expr = op.getEvalExpression('testVar', 'f.....uck');
    expect(expr).toBe('!(/^f.....uck$/im.test(testVar))');

    testVar = 'firetruck';
    expect(eval(expr)).toBe(false);

    testVar = 'fireytruck';
    expect(eval(expr)).toBe(true);

    testVar = 'fireTruck';
    expect(eval(expr)).toBe(false);

    testVar = 'firetrucks';
    expect(eval(expr)).toBe(true);

    testVar = 'fruck';
    expect(eval(expr)).toBe(true);
  });

  it('should not generate a filter function expression if the literal is invalid', function() {
    // doesn't return an expression if the literal is null/empty
    expect(op.getEvalExpression('testVar', null)).toBe('');
    expect(op.getEvalExpression('testVar', '')).toBe('');
    expect(op.getEvalExpression('testVar', '   ')).toBe('');
  });

  it('should match multi-line strings', function() {
    var expr = op.getEvalExpression('testVar', 'testV*');
    expect(expr).toBe('!(/^testV.*$/im.test(testVar))');

    var testVar = 'testVal'; // eslint-disable-line
    expect(eval(expr)).toBe(false);

    testVar = 'otherVal\ntestVal';
    expect(eval(expr)).toBe(false);

    testVar = 'otherVal\nline doesnt start with testVal';
    expect(eval(expr)).toBe(true);
  });
});

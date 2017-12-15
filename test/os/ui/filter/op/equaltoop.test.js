goog.require('os.ui.filter.op.EqualTo');

describe('os.ui.filter.op.EqualTo', function() {
  var op = new os.ui.filter.op.EqualTo();

  it('should be configured correctly', function() {
    expect(op.localName).toBe('PropertyIsEqualTo');
    expect(op.supportedTypes).toBeNull();

    expect(op.getTitle()).toBe('is equal to');
    expect(op.getShortTitle()).toBe('=');
    expect(op.getUi()).toBe('fb-text');
  });

  it('should generate the proper filter function expression', function() {
    // doesn't return an expression if the literal is null
    expect(op.getEvalExpression('testVar', null)).toBe('');

    var expr = op.getEvalExpression('testVar', 'testValue');
    expect(expr).toBe('testVar=="testValue"');

    var testVar = 'testValue';

    // prevent eslint no-unused-vars
    expect(testVar).toBeDefined();

    // same value
    expect(eval(expr)).toBe(true);

    // different values
    testVar = 'testValueeee';
    expect(eval(expr)).toBe(false);

    testVar = undefined;
    expect(eval(expr)).toBe(false);
  });

  it('should not generate a filter function expression if the literal is invalid', function() {
    expect(op.getEvalExpression('testVar', null)).toBe('');
  });
});

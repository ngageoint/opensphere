goog.require('os.ui.filter.op.NotEqualTo');

describe('os.ui.filter.op.NotEqualTo', function() {
  var op = new os.ui.filter.op.NotEqualTo();

  it('should be configured correctly', function() {
    expect(op.localName).toBe('PropertyIsNotEqualTo');
    expect(op.supportedTypes).toBeNull();

    expect(op.getTitle()).toBe('is not equal to');
    expect(op.getShortTitle()).toBe('!=');
    expect(op.getUi()).toBe('fb-text');
  });

  it('should generate the proper filter function expression', function() {
    var expr = op.getEvalExpression('testVar', 'testValue');
    expect(expr).toBe('testVar!="testValue"');

    var testVar = 'testValue';

    // prevent eslint no-unused-vars
    expect(testVar).toBeDefined();

    // same value
    expect(eval(expr)).toBe(false);

    // different values
    testVar = 'testValueeee';
    expect(eval(expr)).toBe(true);

    testVar = undefined;
    expect(eval(expr)).toBe(true);
  });

  it('should not generate a filter function expression if the literal is invalid', function() {
    expect(op.getEvalExpression('testVar', null)).toBe('');
  });
});

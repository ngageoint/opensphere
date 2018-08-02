goog.require('os.ui.filter.op.IsLikeNumeric');
goog.require('os.ui.filter.op.Op');

describe('os.ui.filter.op.IsLikeNumeric', function() {
  var op = new os.ui.filter.op.IsLikeNumeric();

  it('should return the correct defaults', function() {
    expect(op.getTitle()).toBe('is like');

    expect(op.getUi()).toBe('fb-text-no-col-check');
  });

  it('should properly extract the column', function() {
    var filter = '<And>' +
        '<PropertyIsGreaterThanOrEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal>1.25</Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyIsLessThan>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal>1.26</Literal>' +
        '</PropertyIsLessThan></And>';
    var el = $($.parseXML(filter).firstChild);

    expect(op.getColumn(el)).toBe('KEY');
  });

  it('should properly extract the literal', function() {
    var filter = '<And hint="is like numeric">' +
        '<PropertyIsGreaterThanOrEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal>1.25</Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyIsLessThan>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal>1.26</Literal>' +
        '</PropertyIsLessThan></And>';
    var el = $($.parseXML(filter).firstChild);

    expect(op.getLiteral(el)).toBe('1.25*');
  });

  it('should properly match XML', function() {
    var filter = '<And hint="is like numeric">' +
        '<PropertyIsGreaterThanOrEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal>1.25</Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyIsLessThan>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal>1.26</Literal>' +
        '</PropertyIsLessThan></And>';
    var el = $($.parseXML(filter).firstChild);

    expect(op.matches(el)).toBe(true);
  });

  it('should generate the proper filter', function() {
    var expected = '<And hint="is like numeric">' +
        '<PropertyIsGreaterThanOrEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal><![CDATA[1.25]]></Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyIsLessThan>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal><![CDATA[1.26]]></Literal>' +
        '</PropertyIsLessThan></And>';
    expect(op.getFilter('KEY', '1.25*')).toBe(expected);
  });

  it('should generate the proper filter with floating point zeros preserved', function() {
    var expected = '<And hint="is like numeric">' +
        '<PropertyIsGreaterThanOrEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal><![CDATA[1.25]]></Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyIsLessThan>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal><![CDATA[1.250000001]]></Literal>' +
        '</PropertyIsLessThan></And>';
    expect(op.getFilter('KEY', '1.250000000*')).toBe(expected);
  });

  it('should not generate a filter if the range cannot be parsed', function() {
    expect(op.getFilter('KEY', null)).toBe('');
    expect(op.getFilter('KEY', '')).toBe('');
    expect(op.getFilter('KEY', '    ')).toBe('');
    expect(op.getFilter('KEY', ' a* ')).toBe('');
  });

  it('should validate values', function() {
    // doesn't break when the value is empty/undefined
    expect(op.validate(null, 'decimal')).toBe(false);
    expect(op.validate(undefined, 'decimal')).toBe(false);
    expect(op.validate('', 'decimal')).toBe(false);
    expect(op.validate('.*', 'decimal')).toBe(false);

    // invalid for string values
    expect(op.validate('test', 'decimal')).toBe(false);
    expect(op.validate('test*', 'decimal')).toBe(false);

    // valid for expected types of values
    expect(op.validate('42', 'integer')).toBe(true);
    expect(op.validate('42*', 'integer')).toBe(true);
    expect(op.validate('0.250000000*', 'decimal')).toBe(true);
    expect(op.validate('5000.25*', 'decimal')).toBe(true);
    expect(op.validate('5000.25', 'decimal')).toBe(true);

    // valid with dumb spaces
    expect(op.validate('      42.02   *', 'decimal')).toBe(true);
  });

  it('should generate the proper filter function expression', function() {
    var expr = op.getEvalExpression('testVar', '  1.25*  ');
    expect(expr).toBe('(testVar>=1.25&&testVar<1.26)');

    var testVar = 1.25;

    // prevent eslint no-unused-vars
    expect(testVar).toBeDefined();

    // matches start of range
    expect(eval(expr)).toBe(true);

    // matches between range
    testVar = 1.251234;
    expect(eval(expr)).toBe(true);

    // matches near end of range
    testVar = 1.25999999;
    expect(eval(expr)).toBe(true);

    // does not match end of range
    testVar = 1.26;
    expect(eval(expr)).toBe(false);

    // does not match less than beginning of range
    testVar = 1.2499999999;
    expect(eval(expr)).toBe(false);
  });

  it('should not generate a filter function expression if the range cannot be parsed', function() {
    expect(op.getEvalExpression('testVar', null)).toBe('');
    expect(op.getEvalExpression('testVar', '')).toBe('');
    expect(op.getEvalExpression('testVar', '    ')).toBe('');
    expect(op.getEvalExpression('testVar', ' a* ')).toBe('');
  });
});

goog.require('os.ui.filter.op.NotBetween');
goog.require('os.ui.filter.op.Op');


describe('os.ui.filter.op.NotBetween', function() {
  var between = new os.ui.filter.op.NotBetween();

  it('should return the correct defaults', function() {
    expect(between.getTitle()).toBe('is not between');
    expect(between.getAttributes()).toBe('hint="between"');
    expect(between.getUi()).toBe('fb-between');
  });

  it('should properly extract the column', function() {
    var filter = '<Not><And hint="between">' +
        '<PropertyIsGreaterThanOrEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal>1</Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyIsLessThanOrEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal>5</Literal>' +
        '</PropertyIsLessThanOrEqualTo></And></Not>';
    var el = $($.parseXML(filter).firstChild);

    expect(between.getColumn(el)).toBe('KEY');
  });

  it('should properly extract the literal', function() {
    var filter = '<Not><And hint="between">' +
        '<PropertyIsGreaterThanOrEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal>1</Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyIsLessThanOrEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal>5</Literal>' +
        '</PropertyIsLessThanOrEqualTo></And></Not>';
    var el = $($.parseXML(filter).firstChild);

    expect(between.getLiteral(el)).toBe('1, 5');
  });

  it('should properly match XML', function() {
    var filter = '<Not><And hint="between">' +
        '<PropertyIsGreaterThanOrEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal>1</Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyIsLessThanOrEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal>5</Literal>' +
        '</PropertyIsLessThanOrEqualTo></And></Not>';
    var el = $($.parseXML(filter).firstChild);

    expect(between.matches(el)).toBe(true);

    el = $($.parseXML('<And></And>').firstChild);
    expect(between.matches(el)).toBe(false);
  });

  it('should generate the proper filter', function() {
    var expected = '<Not><And hint="between">' +
        '<PropertyIsGreaterThanOrEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal><![CDATA[1]]></Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyIsLessThanOrEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal><![CDATA[5]]></Literal>' +
        '</PropertyIsLessThanOrEqualTo></And></Not>';
    expect(between.getFilter('KEY', '1 ,   5  ')).toBe(expected);
  });

  it('should generate the proper filter function expression', function() {
    var expr = between.getEvalExpression('testVar', '1 ,   5  ');
    expect(expr).toBe('!((testVar>=1&&testVar<=5))');

    var testVar = 1;

    // prevent eslint no-unused-vars
    expect(testVar).toBeDefined();

    // equals min value
    expect(eval(expr)).toBe(false);

    // equals max value
    testVar = 5;
    expect(eval(expr)).toBe(false);

    // between min/max
    testVar = 3;
    expect(eval(expr)).toBe(false);

    // greater than max
    testVar = 6;
    expect(eval(expr)).toBe(true);

    // less than min
    testVar = 0;
    expect(eval(expr)).toBe(true);
  });

  it('should not generate a filter function expression if the range cannot be parsed', function() {
    expect(between.getEvalExpression('testVar', null)).toBe('');
    expect(between.getEvalExpression('testVar', '')).toBe('');
    expect(between.getEvalExpression('testVar', '    ')).toBe('');
    expect(between.getEvalExpression('testVar', ' 1 , a ')).toBe('');
  });

  it('should validate values', function() {
    // doesn't break when the value is empty/undefined
    expect(between.validate(null, 'decimal')).toBe(false);
    expect(between.validate(undefined, 'decimal')).toBe(false);
    expect(between.validate('', 'decimal')).toBe(false);

    // invalid for string values
    expect(between.validate('test', 'decimal')).toBe(false);
    expect(between.validate('test,test', 'decimal')).toBe(false);
    expect(between.validate('1,test', 'decimal')).toBe(false);
    expect(between.validate('test,1', 'decimal')).toBe(false);

    // invalid when there aren't exactly two values
    expect(between.validate('1', 'decimal')).toBe(false);
    expect(between.validate('1.0', 'decimal')).toBe(false);
    expect(between.validate('1,2,3', 'decimal')).toBe(false);
    expect(between.validate('1.0,2.0,3.0', 'decimal')).toBe(false);

    // valid when there are two integer values
    expect(between.validate('-42,-2', 'integer')).toBe(true);
    expect(between.validate('-42,42', 'integer')).toBe(true);
    expect(between.validate('42,84', 'integer')).toBe(true);

    // valid when there are two decimal values
    expect(between.validate('42,84', 'decimal')).toBe(true);
    expect(between.validate('42.0,84.0', 'decimal')).toBe(true);
    expect(between.validate('1.23456,2.34567', 'decimal')).toBe(true);

    // valid with dumb spaces
    expect(between.validate('      42.0   , 84.0    ', 'decimal')).toBe(true);
  });
});

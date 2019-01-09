goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');
goog.require('os.ui.filter.op.time.Between');

describe('os.ui.filter.op.time.Between', function() {
  var between = new os.ui.filter.op.time.Between();
  currentFilterTimestamp = 120000;

  it('should return the correct defaults', function() {
    expect(between.getTitle()).toBe('is between');
    expect(between.getAttributes()).toBe('hint="betweentime"');
    expect(between.getUi()).toBe('betweentime');
  });

  it('should properly extract the column', function() {
    var filter = '<And hint="betweentime">' +
        '<PropertyIsGreaterThanOrEqualTo>' +
            '<PropertyName>TIME</PropertyName>' +
            '<Literal>60000</Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyIsLessThanOrEqualTo>' +
            '<PropertyName>TIME</PropertyName>' +
            '<Literal>120000</Literal>' +
        '</PropertyIsLessThanOrEqualTo></And>';
    var el = $($.parseXML(filter).firstChild);

    expect(between.getColumn(el)).toBe('TIME');
  });

  it('should properly extract the literal', function() {
    var filter = '<And hint="betweentime">' +
        '<PropertyIsGreaterThanOrEqualTo>' +
            '<PropertyName>TIME</PropertyName>' +
            '<Literal>60000</Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyIsLessThanOrEqualTo>' +
            '<PropertyName>TIME</PropertyName>' +
            '<Literal>120000</Literal>' +
        '</PropertyIsLessThanOrEqualTo></And>';
    var el = $($.parseXML(filter).firstChild);

    expect(between.getLiteral(el)).toBe('60000, 120000');
  });

  it('should properly match XML', function() {
    var filter = '<And hint="betweentime">' +
        '<PropertyIsGreaterThanOrEqualTo>' +
            '<PropertyName>TIME</PropertyName>' +
            '<Literal>60000</Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyIsLessThanOrEqualTo>' +
            '<PropertyName>TIME</PropertyName>' +
            '<Literal>120000</Literal>' +
        '</PropertyIsLessThanOrEqualTo></And>';
    var el = $($.parseXML(filter).firstChild);

    // it should match the correct hint
    expect(between.matches(el)).toBe(true);

    var noMatch = '<And>' +
        '<PropertyIsGreaterThanOrEqualTo>' +
            '<PropertyName>LAT</PropertyName>' +
            '<Literal>20</Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyIsLessThanOrEqualTo>' +
            '<PropertyName>LAT</PropertyName>' +
            '<Literal>50</Literal>' +
        '</PropertyIsLessThanOrEqualTo></And>';
    el = $($.parseXML(noMatch).firstChild);

    // it should not match a similar filter structure without the hint
    expect(between.matches(el)).toBe(false);
  });

  it('should generate the proper filter', function() {
    var expected = '<And hint="betweentime">' +
        '<PropertyIsGreaterThanOrEqualTo>' +
            '<PropertyName>TIME</PropertyName>' +
            '<Literal><![CDATA[1]]></Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyIsLessThanOrEqualTo>' +
            '<PropertyName>TIME</PropertyName>' +
            '<Literal><![CDATA[5]]></Literal>' +
        '</PropertyIsLessThanOrEqualTo></And>';
    expect(between.getFilter('TIME', '1 ,   5  ')).toBe(expected);
  });

  it('should generate the proper filter function expression', function() {
    var expr = between.getEvalExpression('testVar', '60000 ,   120000  ');
    expect(expr).toBe('testVar!=null&&currentFilterTimestamp-120000<=testVar.getEnd()&&' +
        'currentFilterTimestamp-60000>=testVar.getStart()');
  });

  it('should evaluate its filter function correctly on time instants', function() {
    // this test defines the currentFilterTimestamp = 120000, so we are looking for hits between 60000 and 120000
    // before that, AKA values between 0 and 60000
    var expr = between.getEvalExpression('testVar', '60000 ,   120000  ');
    var testVar = new os.time.TimeInstant(0);

    // prevent eslint no-unused-vars
    expect(testVar).toBeDefined();

    // equals min value
    expect(eval(expr)).toBe(true);

    // equals max value
    testVar = new os.time.TimeInstant(60000);
    expect(eval(expr)).toBe(true);

    // between min/max
    testVar = new os.time.TimeInstant(40000);
    expect(eval(expr)).toBe(true);

    // greater than max
    testVar = new os.time.TimeInstant(80000);
    expect(eval(expr)).toBe(false);

    // less than min
    testVar = new os.time.TimeInstant(-10000);
    expect(eval(expr)).toBe(false);
  });

  it('should evaluate its filter function correctly on time ranges', function() {
    var expr = between.getEvalExpression('testVar', '60000 ,   120000  ');
    var testVar = new os.time.TimeRange(-10000, 0);

    // prevent eslint no-unused-vars
    expect(testVar).toBeDefined();

    // range end equals the min value
    expect(eval(expr)).toBe(true);

    // range end between the min and max values
    testVar = new os.time.TimeRange(-10000, 10000);
    expect(eval(expr)).toBe(true);

    // range entirely between the min and max values
    testVar = new os.time.TimeRange(20000, 30000);
    expect(eval(expr)).toBe(true);

    // range start before the min and range end after the min
    testVar = new os.time.TimeRange(-10000, 90000);
    expect(eval(expr)).toBe(true);

    // range start between the min and max values
    testVar = new os.time.TimeRange(30000, 140000);
    expect(eval(expr)).toBe(true);

    // range start equals the max value
    testVar = new os.time.TimeRange(60000, 180000);
    expect(eval(expr)).toBe(true);

    // range entirely before the min value
    testVar = new os.time.TimeRange(-20000, -10000);
    expect(eval(expr)).toBe(false);

    // range entirely after the max value
    testVar = new os.time.TimeRange(130000, 200000);
    expect(eval(expr)).toBe(false);
  });

  it('should not blow up on null values', function() {
    var expr = between.getEvalExpression('testVar', '60000 ,   120000  ');
    var testVar = null;

    // prevent eslint no-unused-vars
    expect(testVar).toBeNull();

    // never match an undefined/null value
    expect(eval(expr)).toBe(false);
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

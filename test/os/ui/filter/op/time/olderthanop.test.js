goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');
goog.require('os.ui.filter.op.time.OlderThan');

describe('os.ui.filter.op.time.OlderThan', function() {
  var between = new os.ui.filter.op.time.OlderThan();
  currentFilterTimestamp = 120000;

  it('should return the correct defaults', function() {
    expect(between.getTitle()).toBe('older than');
    expect(between.getAttributes()).toBe('hint="older"');
    expect(between.getUi()).toBe('newerolderthan');
  });

  it('should properly extract the column', function() {
    var filter =
        '<PropertyIsGreaterThan hint="older">' +
            '<PropertyName>TIME</PropertyName>' +
            '<Literal>60000</Literal>' +
        '</PropertyIsGreaterThan>';
    var el = $($.parseXML(filter).firstChild);

    expect(between.getColumn(el)).toBe('TIME');
  });

  it('should properly extract the literal', function() {
    var filter =
        '<PropertyIsGreaterThan hint="older">' +
            '<PropertyName>TIME</PropertyName>' +
            '<Literal>60000</Literal>' +
        '</PropertyIsGreaterThan>';
    var el = $($.parseXML(filter).firstChild);

    expect(between.getLiteral(el)).toBe('60000');
  });

  it('should properly match XML', function() {
    var filter =
        '<PropertyIsGreaterThan hint="older">' +
            '<PropertyName>TIME</PropertyName>' +
            '<Literal>60000</Literal>' +
        '</PropertyIsGreaterThan>';
    var el = $($.parseXML(filter).firstChild);

    // it should match the correct hint
    expect(between.matches(el)).toBe(true);

    var noMatch =
        '<PropertyIsGreaterThan>' +
            '<PropertyName>LON</PropertyName>' +
            '<Literal>30</Literal>' +
        '</PropertyIsGreaterThan>';
    el = $($.parseXML(noMatch).firstChild);

    // it should not match a similar filter structure without the hint
    expect(between.matches(el)).toBe(false);
  });

  it('should generate the proper filter', function() {
    var expected =
        '<PropertyIsGreaterThan hint="older">' +
            '<PropertyName>TIME</PropertyName>' +
            '<Literal><![CDATA[30000]]></Literal>' +
        '</PropertyIsGreaterThan>';
    expect(between.getFilter('TIME', '30000')).toBe(expected);
  });

  it('should generate the proper filter function expression', function() {
    var expr = between.getEvalExpression('testVar', '60000');
    expect(expr).toBe('testVar!=null&&currentFilterTimestamp-60000>testVar.getStart()');
  });

  it('should evaluate its filter function correctly on time instants', function() {
    var expr = between.getEvalExpression('testVar', '60000');
    var testVar = new os.time.TimeInstant(60000);

    // prevent eslint no-unused-vars
    expect(testVar).toBeDefined();

    // equals the value
    expect(eval(expr)).toBe(false);

    // older than
    testVar = new os.time.TimeInstant(40000);
    expect(eval(expr)).toBe(true);

    // newer than
    testVar = new os.time.TimeInstant(80000);
    expect(eval(expr)).toBe(false);
  });

  it('should evaluate its filter function correctly on time ranges', function() {
    var expr = between.getEvalExpression('testVar', '60000');
    var testVar = new os.time.TimeRange(60000, 70000);

    // prevent eslint no-unused-vars
    expect(testVar).toBeDefined();

    // range end equals the value
    expect(eval(expr)).toBe(false);

    // range end greater than the value
    testVar = new os.time.TimeRange(50000, 80000);
    expect(eval(expr)).toBe(true);

    // range entirely greater than the value
    testVar = new os.time.TimeRange(20000, 30000);
    expect(eval(expr)).toBe(true);

    // range entirely before the value
    testVar = new os.time.TimeRange(100000, 110000);
    expect(eval(expr)).toBe(false);
  });

  it('should not blow up on null values', function() {
    var expr = between.getEvalExpression('testVar', '60000');
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

    // invalid when there isn't exactly 1 value
    expect(between.validate('1.0,2.0', 'decimal')).toBe(false);
    expect(between.validate('1,2,3', 'decimal')).toBe(false);
    expect(between.validate('1.0,2.0,3.0', 'decimal')).toBe(false);

    // valid when it's an integer value
    expect(between.validate('-42', 'integer')).toBe(true);
    expect(between.validate('-42', 'integer')).toBe(true);
    expect(between.validate('42', 'integer')).toBe(true);

    // valid when it is a decimal value
    expect(between.validate('42', 'decimal')).toBe(true);
    expect(between.validate('42.0', 'decimal')).toBe(true);
    expect(between.validate('1.23456', 'decimal')).toBe(true);
  });
});

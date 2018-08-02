goog.require('os.ui.filter.op.LikeListNumeric');
goog.require('os.ui.filter.op.Op');

describe('os.ui.filter.op.LikeListNumeric', function() {
  var op = new os.ui.filter.op.LikeListNumeric();

  it('should return the correct defaults', function() {
    expect(op.getTitle()).toBe('is like list');

    expect(op.getUi()).toBe('fb-list-no-col-check');
  });

  it('should properly match XML', function() {
    var filter = '<Or hint="like list numeric"><And hint="is like numeric">' +
        '<PropertyIsGreaterThanOrEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal>1.25</Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyIsLessThan>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal>1.26</Literal>' +
        '</PropertyIsLessThan></And><And hint="is like numeric">' +
        '<PropertyIsGreaterThanOrEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal>12.366</Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyIsLessThan>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal>12.367</Literal>' +
        '</PropertyIsLessThan></And></Or>';
    var el = $($.parseXML(filter).firstChild);

    expect(op.matches(el)).toBe(true);
  });

  it('should generate the proper filter', function() {
    var expected = '<Or hint="like list numeric"><And hint="is like numeric">' +
        '<PropertyIsGreaterThanOrEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal><![CDATA[1.25]]></Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyIsLessThan>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal><![CDATA[1.26]]></Literal>' +
        '</PropertyIsLessThan></And><And hint="is like numeric">' +
        '<PropertyIsGreaterThanOrEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal><![CDATA[12.366]]></Literal>' +
        '</PropertyIsGreaterThanOrEqualTo>' +
        '<PropertyIsLessThan>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal><![CDATA[12.367]]></Literal>' +
        '</PropertyIsLessThan></And></Or>';
    expect(op.getFilter('KEY', '1.25*, 12.366*')).toBe(expected);
  });

  it('should generate the proper filter function expression', function() {
    var expr = op.getEvalExpression('testVar', '  1.25*  ,  12.56*,.42*  ');
    expect(expr).toBe('((testVar>=1.25&&testVar<1.26)||(testVar>=12.56&&testVar<12.57)||' +
        '(testVar>=0.42&&testVar<0.43))');

    //
    // First range
    //

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

    //
    // Second range
    //

    // matches start of range
    var testVar = 12.56;
    expect(eval(expr)).toBe(true);

    // matches between range
    testVar = 12.5678901;
    expect(eval(expr)).toBe(true);

    // matches near end of range
    testVar = 12.56999999;
    expect(eval(expr)).toBe(true);

    // does not match end of range
    testVar = 12.57;
    expect(eval(expr)).toBe(false);

    // does not match less than beginning of range
    testVar = 12.5599999999;
    expect(eval(expr)).toBe(false);

    //
    // Third range
    //

    // matches start of range
    var testVar = 0.42;
    expect(eval(expr)).toBe(true);

    // matches between range
    testVar = 0.423456789;
    expect(eval(expr)).toBe(true);

    // matches near end of range
    testVar = 0.429999999;
    expect(eval(expr)).toBe(true);

    // does not match end of range
    testVar = 0.43;
    expect(eval(expr)).toBe(false);

    // does not match less than beginning of range
    testVar = 0.4199999999;
    expect(eval(expr)).toBe(false);
  });

  it('should not generate a filter expression if a list cannot be parsed', function() {
    expect(op.getEvalExpression('testVar', null)).toBe('');
    expect(op.getEvalExpression('testVar', '')).toBe('');
    expect(op.getEvalExpression('testVar', '   ')).toBe('');
    expect(op.getEvalExpression('testVar', ',,,')).toBe('');
    expect(op.getEvalExpression('testVar', ' ,  ,  ')).toBe('');
    expect(op.getEvalExpression('testVar', ' ,  , a ')).toBe('');
  });
});

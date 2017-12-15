goog.require('os.ui.filter.op.IsNull');

describe('os.ui.filter.op.IsNull', function() {
  var op = new os.ui.filter.op.IsNull();

  it('should return the correct default UI', function() {
    expect(op.getUi()).toBe('span');
  });

  it('should not extract a literal', function() {
    var filter = '<MattersNot><PropertyName>KEY</PropertyName><Literal><![CDATA[abc]]></Literal></MattersNot>';
    var el = $($.parseXML(filter).firstChild);

    expect(op.getLiteral(el)).toBeNull();
  });

  it('should properly match against XML', function() {
    var filter = '<PropertyIsNull><PropertyName>KEY</PropertyName></PropertyIsNull>';
    var el = $($.parseXML(filter).firstChild);

    expect(op.matches(el)).toBe(true);

    filter = '<MattersNot><PropertyName>KEY</PropertyName><Literal><![CDATA[abc]]></Literal></MattersNot>';
    el = $($.parseXML(filter).firstChild);

    expect(op.matches(el)).toBe(false);
  });

  it('should generate the proper filter', function() {
    var propName = '<PropertyName>KEY</PropertyName>';

    // test op with falsy literal
    var expected = '<PropertyIsNull>' + propName + '</PropertyIsNull>';
    expect(op.getFilter('KEY')).toBe(expected);
    expect(op.getFilter('KEY', null)).toBe(expected);
    expect(op.getFilter('KEY', '')).toBe(expected);
  });

  it('should generate the proper filter function expression', function() {
    // literal doesn't affect the expression
    expect(op.getEvalExpression('testVar', null)).toBe('(testVar==null||testVar==="")');
    expect(op.getEvalExpression('testVar', '')).toBe('(testVar==null||testVar==="")');
    expect(op.getEvalExpression('testVar', 'whatever')).toBe('(testVar==null||testVar==="")');

    var expr = op.getEvalExpression('testVar', 'thisIsntUsed');
    expect(expr).toBe('(testVar==null||testVar==="")');

    var testVar = null;

    // prevent eslint no-unused-vars
    expect(testVar).toBeDefined();

    // null/undefined and empty string should be true
    expect(eval(expr)).toBe(true);

    testVar = undefined;
    expect(eval(expr)).toBe(true);

    testVar = '';
    expect(eval(expr)).toBe(true);

    // all other values false
    testVar = 'null';
    expect(eval(expr)).toBe(false);

    testVar = 'undefined';
    expect(eval(expr)).toBe(false);

    testVar = 0;
    expect(eval(expr)).toBe(false);

    testVar = false;
    expect(eval(expr)).toBe(false);

    testVar = NaN;
    expect(eval(expr)).toBe(false);

    testVar = [];
    expect(eval(expr)).toBe(false);

    testVar = {};
    expect(eval(expr)).toBe(false);
  });
});

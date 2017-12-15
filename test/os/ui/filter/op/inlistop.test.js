goog.require('os.ui.filter.op.InList');
goog.require('os.ui.filter.op.Op');

describe('os.ui.filter.op.InList', function() {
  var op = new os.ui.filter.op.InList();

  it('should return the correct defaults', function() {
    expect(op.getTitle()).toBe('is in list');
    expect(op.getAttributes()).toBe('hint="in list"');
    expect(op.getUi()).toBe('fb-list');
  });

  it('should properly extract the column', function() {
    var filter = '<Or hint="in list">' +
        '<PropertyIsEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal>A</Literal>' +
        '</PropertyIsEqualTo>' +
        '<PropertyIsEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal>B</Literal>' +
        '</PropertyIsEqualTo></Or>';
    var el = $($.parseXML(filter).firstChild);

    expect(op.getColumn(el)).toBe('KEY');
  });

  it('should properly extract the literal', function() {
    var filter = '<Or hint="in list">' +
        '<PropertyIsEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal>A</Literal>' +
        '</PropertyIsEqualTo>' +
        '<PropertyIsEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal>B</Literal>' +
        '</PropertyIsEqualTo></Or>';
    var el = $($.parseXML(filter).firstChild);

    expect(op.getLiteral(el)).toBe('A, B');
  });

  it('should properly match XML', function() {
    var filter = '<Or hint="in list">' +
        '<PropertyIsEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal>A</Literal>' +
        '</PropertyIsEqualTo>' +
        '<PropertyIsEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal>B</Literal>' +
        '</PropertyIsEqualTo></Or>';
    var el = $($.parseXML(filter).firstChild);

    expect(op.matches(el)).toBe(true);

    el = $($.parseXML('<Or></Or>').firstChild);
    expect(op.matches(el)).toBe(false);
  });

  it('should generate the proper filter', function() {
    var expected = '<Or hint="in list">' +
        '<PropertyIsEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal><![CDATA[A]]></Literal>' +
        '</PropertyIsEqualTo>' +
        '<PropertyIsEqualTo>' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal><![CDATA[B]]></Literal>' +
        '</PropertyIsEqualTo></Or>';

    expect(op.getFilter('KEY', 'A ,   B  ')).toBe(expected);
  });

  it('should not generate a filter if a list cannot be parsed', function() {
    expect(op.getFilter('KEY', null)).toBe('');
    expect(op.getFilter('KEY', '')).toBe('');
    expect(op.getFilter('KEY', '   ')).toBe('');
    expect(op.getFilter('KEY', ',,,')).toBe('');
    expect(op.getFilter('KEY', ' ,  ,  ')).toBe('');
  });

  it('should generate the proper filter function expression', function() {
    var expr = op.getEvalExpression('testVar', '  1,  2,   whiskey,tango  ,  false ');
    expect(expr).toBe('(["1","2","whiskey","tango","false"]).indexOf(String(testVar))!=-1');

    var testVar = 1;

    // prevent eslint no-unused-vars
    expect(testVar).toBeDefined();

    expect(eval(expr)).toBe(true);

    testVar = '1';
    expect(eval(expr)).toBe(true);

    testVar = 2;
    expect(eval(expr)).toBe(true);

    testVar = 3;
    expect(eval(expr)).toBe(false);

    testVar = 'whiskey';
    expect(eval(expr)).toBe(true);

    testVar = 'tango';
    expect(eval(expr)).toBe(true);

    testVar = 'foxtrot';
    expect(eval(expr)).toBe(false);

    testVar = false;
    expect(eval(expr)).toBe(true);

    testVar = 'false';
    expect(eval(expr)).toBe(true);

    testVar = true;
    expect(eval(expr)).toBe(false);

    testVar = 'true';
    expect(eval(expr)).toBe(false);

    testVar = undefined;
    expect(eval(expr)).toBe(false);

    testVar = null;
    expect(eval(expr)).toBe(false);
  });

  it('should not generate a filter expression if a list cannot be parsed', function() {
    expect(op.getEvalExpression('testVar', null)).toBe('');
    expect(op.getEvalExpression('testVar', '')).toBe('');
    expect(op.getEvalExpression('testVar', '   ')).toBe('');
    expect(op.getEvalExpression('testVar', ',,,')).toBe('');
    expect(op.getEvalExpression('testVar', ' ,  ,  ')).toBe('');
  });
});

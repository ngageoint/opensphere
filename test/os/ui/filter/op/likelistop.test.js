goog.require('os.ui.filter.op.LikeList');

describe('os.ui.filter.op.LikeList', function() {
  var op = new os.ui.filter.op.LikeList();

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
    expect(op.matches(el)).toBe(false);

    filter = filter.replace('in list', 'like list');
    el = $($.parseXML(filter).firstChild);

    expect(op.matches(el)).toBe(true);
  });

  it('should generate the proper filter', function() {
    var expected = '<Or hint="like list">' +
        '<PropertyIsLike wildCard="*" singleChar="." escape="\\">' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal><![CDATA[A]]></Literal>' +
        '</PropertyIsLike>' +
        '<PropertyIsLike wildCard="*" singleChar="." escape="\\">' +
            '<PropertyName>KEY</PropertyName>' +
            '<Literal><![CDATA[B]]></Literal>' +
        '</PropertyIsLike></Or>';

    expect(op.getFilter('KEY', 'A ,   B  ')).toBe(expected);
  });

  it('should generate the proper filter function expression', function() {
    // starts with 'a', ends with 'b', contains 'c', d plus two more characters
    var expr = op.getEvalExpression('testVar', 'a*, *b,   *c*   ,   d..');
    expect(expr).toBe('/^(a.*|.*b|.*c.*|d..)$/i.test(testVar)');

    var testVar = 'aTest';

    // prevent eslint no-unused-vars
    expect(testVar).toBeDefined();

    expect(eval(expr)).toBe(true);

    testVar = 'ATest';
    expect(eval(expr)).toBe(true);

    testVar = 'bTest';
    expect(eval(expr)).toBe(false);

    testVar = 'testB';
    expect(eval(expr)).toBe(true);

    testVar = 'testCtest';
    expect(eval(expr)).toBe(true);

    testVar = 'do';
    expect(eval(expr)).toBe(false);

    testVar = 'dog';
    expect(eval(expr)).toBe(true);

    testVar = 'dogs';
    expect(eval(expr)).toBe(false);

    testVar = 'test';
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

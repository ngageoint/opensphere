goog.require('os.ui.filter.op.Op');

describe('os.ui.filter.op.Op', function() {
  var testOpName = 'TestOp';
  var op = new os.ui.filter.op.Op(testOpName);

  it('should use the provided localName', function() {
    expect(op.localName).toBe(testOpName);
  });

  it('should default to supporting any column types', function() {
    // supports anything by default
    expect(op.isSupported('string')).toBe(true);
    expect(op.isSupported('integer')).toBe(true);
    expect(op.isSupported('decimal')).toBe(true);
    expect(op.isSupported('whatever')).toBe(true);

    // GML types are not supported
    expect(op.isSupported('gml:string')).toBe(false);

    // can set supported types
    op.setSupported(['string', 'integer']);
    expect(op.isSupported('string')).toBe(true);
    expect(op.isSupported('integer')).toBe(true);
    expect(op.isSupported('decimal')).toBe(false);
    expect(op.isSupported('whatever')).toBe(false);

    // support everything again
    op.setSupported(null);
    expect(op.isSupported('string')).toBe(true);
    expect(op.isSupported('integer')).toBe(true);
    expect(op.isSupported('decimal')).toBe(true);
    expect(op.isSupported('whatever')).toBe(true);
  });

  it('should return the correct default UI', function() {
    expect(op.getUi()).toBe('fb-text');
  });

  it('should properly extract the column from the PropertyName element', function() {
    var filter = '<MattersNot><PropertyName>KEY</PropertyName><Literal><![CDATA[abc]]></Literal></MattersNot>';
    var el = $($.parseXML(filter).firstChild);

    expect(op.getColumn(el)).toBe('KEY');
  });

  it('should properly extract the literal from the Literal element', function() {
    var filter = '<MattersNot><PropertyName>KEY</PropertyName><Literal><![CDATA[abc]]></Literal></MattersNot>';
    var el = $($.parseXML(filter).firstChild);

    // defaults to false
    expect(op.getLiteral(el)).toBe('abc');

    // can set to true
    op.setExcludeLiteral(true);
    expect(op.getLiteral(el)).toBeNull();

    // and back to false
    op.setExcludeLiteral(false);
    expect(op.getLiteral(el)).toBe('abc');
  });

  it('should properly match against XML', function() {
    var filter = '<' + testOpName + '>' +
        '<PropertyName>KEY</PropertyName>' +
        '<Literal>value</Literal>' +
        '</' + testOpName + '>';
    var el = $($.parseXML(filter).firstChild);

    expect(op.matches(el)).toBe(true);

    filter = '<WrongName><PropertyName>KEY</PropertyName><Literal><![CDATA[abc]]></Literal></WrongName>';
    el = $($.parseXML(filter).firstChild);

    expect(op.matches(el)).toBe(false);
  });

  it('should generate the proper filter', function() {
    var propName = '<PropertyName>KEY</PropertyName>';
    var literal = '<Literal><![CDATA[value]]></Literal>';

    var expected = '<' + testOpName + '>' + propName + literal + '</' + testOpName + '>';
    expect(op.getFilter('KEY', '  value  ')).toBe(expected);

    // can set attributes
    var attrs = 'first="true" second="false"';
    op.setAttributes(attrs);

    expected = '<' + testOpName + ' ' + attrs + '>' + propName + literal + '</' + testOpName + '>';
    expect(op.getFilter('KEY', '  value  ')).toBe(expected);

    // can unset attributes
    op.setAttributes(null);
    expected = '<' + testOpName + '>' + propName + literal + '</' + testOpName + '>';
    expect(op.getFilter('KEY', '  value  ')).toBe(expected);
  });

  it('should generate the proper filter function expression', function() {
    var expr = op.getEvalExpression('thisIsntUsed', 'neitherIsThis');
    expect(expr).toBe('');
  });
});

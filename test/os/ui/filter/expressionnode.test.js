goog.require('os.data.ColumnDefinition');
goog.require('os.ui.filter.ui.ExpressionNode');


describe('os.ui.filter.ui.ExpressionNode', function() {
  var cols = [
    new os.data.ColumnDefinition('ALT'),
    new os.data.ColumnDefinition('LAT'),
    new os.data.ColumnDefinition('LON')
  ];
  var filter = '<PropertyIsGreaterThan><PropertyName>ALT</PropertyName><Literal>55</Literal></PropertyIsGreaterThan>';
  var node = $.parseXML(filter).firstChild;
  var exprNode = os.ui.filter.ui.ExpressionNode.createExpressionNode(node, cols);

  it('should create new expression nodes from filters', function() {
    var expr = exprNode.getExpression();
    expect(exprNode.getLabel()).toBe('ALT <b>is greater than</b> 55');
    expect(expr).not.toBe(null);
    expect(expr.columnName).toBe('ALT');
    expect(expr['column']).toBe(cols[0]);
    expect(expr['literal']).toBe('55');
    expect(expr['op']).not.toBe(null);
    expect(expr['op'] instanceof os.ui.filter.op.Op).toBe(true);
    expect(expr['op'].localName).toBe('PropertyIsGreaterThan');
  });

  it('should write out its filters correctly', function() {
    expect(exprNode.writeFilter())
        .toBe('<PropertyIsGreaterThan><PropertyName>ALT</PropertyName>' +
        '<Literal><![CDATA[55]]></Literal></PropertyIsGreaterThan>');
  });
});

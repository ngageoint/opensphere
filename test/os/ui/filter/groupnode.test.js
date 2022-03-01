goog.require('os.data.ColumnDefinition');
goog.require('os.ui.filter.ui.ExpressionNode');
goog.require('os.ui.filter.ui.GroupNode');


describe('os.ui.filter.ui.GroupNode', function() {
  const {default: ColumnDefinition} = goog.module.get('os.data.ColumnDefinition');
  const {default: ExpressionNode} = goog.module.get('os.ui.filter.ui.ExpressionNode');
  const {default: GroupNode} = goog.module.get('os.ui.filter.ui.GroupNode');

  var cols = [
    new ColumnDefinition('ALT'),
    new ColumnDefinition('LAT'),
    new ColumnDefinition('LON')
  ];
  var filter = '<PropertyIsGreaterThan><PropertyName>ALT</PropertyName><Literal>55</Literal></PropertyIsGreaterThan>';
  var node = $.parseXML(filter).firstChild;
  var exprNode = ExpressionNode.createExpressionNode(node, cols);

  it('should instantiate correctly', function() {
    var groupingNode = new GroupNode();
    expect(groupingNode['grouping']).toBe('And');
    expect(groupingNode.collapsed).toBe(false);
  });

  it('should write out its filter correctly', function() {
    // it should not write anything if it has no children
    var groupingNode = new GroupNode();
    expect(groupingNode.writeFilter()).toBe('');

    groupingNode.addChild(exprNode);
    expect(groupingNode.writeFilter('nametest', 'desctest'))
        .toBe('<And namehint="nametest" description="desctest">' +
        '<PropertyIsGreaterThan><PropertyName>ALT</PropertyName>' +
        '<Literal><![CDATA[55]]></Literal></PropertyIsGreaterThan>' +
        '</And>');
  });
});

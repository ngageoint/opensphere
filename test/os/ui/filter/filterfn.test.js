goog.require('os.filter.FilterEntry');
goog.require('os.ui.filter.fn');
goog.require('goog.dom.xml');

describe('os.ui.filter.fn', function() {
  var andXml =
      '<And>' +
        '<PropertyIsEqualTo>' +
          '<PropertyName>AND1</PropertyName><Literal><![CDATA[value1]]></Literal>' +
        '</PropertyIsEqualTo>' +
        '<PropertyIsEqualTo>' +
          '<PropertyName>AND2</PropertyName><Literal><![CDATA[value2]]></Literal>' +
        '</PropertyIsEqualTo>' +
        '<PropertyIsEqualTo>' +
          '<PropertyName>AND3</PropertyName><Literal><![CDATA[value3]]></Literal>' +
        '</PropertyIsEqualTo>' +
      '</And>';
  var andNode = goog.dom.xml.loadXml(andXml).firstChild;
  var andEntry = new os.filter.FilterEntry();
  andEntry.setFilter(andXml);

  var orXml =
      '<Or>' +
        '<PropertyIsEqualTo>' +
          '<PropertyName>OR1</PropertyName><Literal><![CDATA[value4]]></Literal>' +
        '</PropertyIsEqualTo>' +
        '<PropertyIsEqualTo>' +
          '<PropertyName>OR2</PropertyName><Literal><![CDATA[value5]]></Literal>' +
        '</PropertyIsEqualTo>' +
        '<PropertyIsEqualTo>' +
          '<PropertyName>OR3</PropertyName><Literal><![CDATA[value6]]></Literal>' +
        '</PropertyIsEqualTo>' +
      '</Or>';
  var orNode = goog.dom.xml.loadXml(orXml).firstChild;
  var orEntry = new os.filter.FilterEntry();
  orEntry.setFilter(orXml);

  var notXml =
      '<Not>' +
        '<PropertyIsNull>' +
          '<PropertyName>NOT1</PropertyName></Literal>' +
        '</PropertyIsNull>' +
      '</Not>';
  var notNode = goog.dom.xml.loadXml(notXml).firstChild;
  var notEntry = new os.filter.FilterEntry();
  notEntry.setFilter(notXml);

  it('should create an expression to get a value from an object', function() {
    var testObj = {
      'field1': 10,
      'field"2"': 20
    };

    // avoid no-unused-vars lint error
    expect(testObj).toBeDefined();

    var getter = os.ui.filter.fn.defaultGetter('testObj', 'field1');
    expect(getter).toBe('testObj["field1"]');
    expect(eval(getter)).toBe(10);

    getter = os.ui.filter.fn.defaultGetter('testObj', 'field"2"');
    expect(getter).toBe('testObj["field\\"2\\""]');
    expect(eval(getter)).toBe(20);

    getter = os.ui.filter.fn.defaultGetter('testObj', 'field3');
    expect(getter).toBe('testObj["field3"]');
    expect(eval(getter)).toBeUndefined();
  });

  it('should create an expression to assign a variable', function() {
    var testObj = {
      'field1': 10,
      'field2': 20
    };

    // avoid no-unused-vars lint error
    expect(testObj).toBeDefined();

    os.ui.filter.fn.defaultGetter('testObj', 'field1');

    var field1;
    var field2;

    // vars are undefined
    expect(field1).toBeUndefined();
    expect(field2).toBeUndefined();

    // create and evaluate expressions to assign them
    var decl = os.ui.filter.fn.varDeclaration('field1', os.ui.filter.fn.defaultGetter('testObj', 'field1'));
    expect(decl).toBe('var field1=testObj["field1"];');
    eval(decl);

    decl = os.ui.filter.fn.varDeclaration('field2', os.ui.filter.fn.defaultGetter('testObj', 'field2'));
    expect(decl).toBe('var field2=testObj["field2"];');
    eval(decl);

    // now they are defined
    expect(field1).toBe(10);
    expect(field2).toBe(20);
  });

  it('should create a map of property names to variable names from a node', function() {
    // no PropertyName elements
    var xml = '<Whatever></Whatever>';
    var node = goog.dom.xml.loadXml(xml).firstChild;
    var vars = os.ui.filter.fn.createVarMap(node);
    expect(vars).toBeDefined();
    expect(goog.object.isEmpty(vars)).toBe(true);

    // single PropertyName element
    xml = '<Whatever><PropertyName>KEY</PropertyName></Whatever>';
    node = goog.dom.xml.loadXml(xml).firstChild;
    vars = os.ui.filter.fn.createVarMap(node);
    expect(vars).toBeDefined();
    expect(goog.object.isEmpty(vars)).toBe(false);
    expect(vars['KEY']).toBe('v0');

    // multiple PropertyName elements
    xml = '<Whatever>' +
        '<PropertyName>KEY1</PropertyName>' +
        '<Whatever><PropertyName>KEY2</PropertyName></Whatever>' +
        '<PropertyName>KEY3</PropertyName>' +
        '</Whatever>';
    node = goog.dom.xml.loadXml(xml).firstChild;
    vars = os.ui.filter.fn.createVarMap(node);
    expect(vars).toBeDefined();
    expect(goog.object.isEmpty(vars)).toBe(false);
    expect(vars['KEY1']).toBe('v0');
    expect(vars['KEY2']).toBe('v1');
    expect(vars['KEY3']).toBe('v2');
  });

  it('should create filter function strings from a node', function() {
    var vars = {};

    // returns empty string if vars aren't defined
    expect(os.ui.filter.fn.getNodeExpression(andNode, vars)).toBe('');

    // skips expressions if the property isn't in the var map
    vars['AND1'] = 'v0';
    expect(os.ui.filter.fn.getNodeExpression(andNode, vars)).toBe('(v0=="value1")');

    // combines multiple expressions with '&&'
    vars['AND2'] = 'v1';
    expect(os.ui.filter.fn.getNodeExpression(andNode, vars)).toBe('(v0=="value1"&&v1=="value2")');

    vars['AND3'] = 'v2';
    expect(os.ui.filter.fn.getNodeExpression(andNode, vars)).toBe('(v0=="value1"&&v1=="value2"&&v2=="value3")');

    // returns empty string if vars aren't defined
    expect(os.ui.filter.fn.getNodeExpression(orNode, vars)).toBe('');

    // skips expressions if the property isn't in the var map
    vars['OR1'] = 'v3';
    expect(os.ui.filter.fn.getNodeExpression(orNode, vars)).toBe('(v3=="value4")');

    // combines multiple expressions with '||'
    vars['OR2'] = 'v4';
    expect(os.ui.filter.fn.getNodeExpression(orNode, vars)).toBe('(v3=="value4"||v4=="value5")');

    vars['OR3'] = 'v5';
    expect(os.ui.filter.fn.getNodeExpression(orNode, vars)).toBe('(v3=="value4"||v4=="value5"||v5=="value6")');

    // returns empty string if vars aren't defined
    expect(os.ui.filter.fn.getNodeExpression(notNode, vars)).toBe('');

    // skips expressions if the property isn't in the var map
    vars['NOT1'] = 'v6';
    expect(os.ui.filter.fn.getNodeExpression(notNode, vars)).toBe('!((v6==null||v6===""))');
  });

  it('should create filter functions from a node', function() {
    var testObj = {
      // AND keys
      'AND1': 'value1',
      'AND2': 'value2',
      'AND3': 'value3'
    };

    // create from the root AND node, should pass the filter
    var fn = os.ui.filter.fn.createFromNode(andNode);
    expect(goog.isFunction(fn)).toBe(true);
    expect(fn(testObj)).toBe(true);

    // changing a value should return false
    testObj['AND1'] = 'wrongValue';
    expect(fn(testObj)).toBe(false);

    // change it back
    testObj['AND1'] = 'value1';
    expect(fn(testObj)).toBe(true);

    // create a filter from the first expression only (test AND1)
    fn = os.ui.filter.fn.createFromNode(andNode.childNodes[0]);
    expect(goog.isFunction(fn)).toBe(true);
    expect(fn(testObj)).toBe(true);

    // changing AND2 shouldn't affect the result
    testObj['AND2'] = 'wrongValue';
    expect(fn(testObj)).toBe(true);

    // changing AND1 should affect the result
    testObj['AND1'] = 'wrongValue';
    expect(fn(testObj)).toBe(false);

    // create the filter on the AND2 expression - value is wrong so it shouldn't pass
    fn = os.ui.filter.fn.createFromNode(andNode.childNodes[1]);
    expect(goog.isFunction(fn)).toBe(true);
    expect(fn(testObj)).toBe(false);

    // changing AND2 back should make the result true
    testObj['AND2'] = 'value2';
    expect(fn(testObj)).toBe(true);
  });

  it('should create filter functions from filter entries', function() {
    var testObj = {
      // AND keys
      'AND1': 'value1',
      'AND2': 'value2',
      'AND3': 'value3',

      // OR keys
      'OR1': 'value4',
      'OR2': 'value5',
      'OR3': 'value6',

      // NOT keys
      'NOT1': 'notNull'
    };

    // no filter should return a function that always returns false
    var emptyEntry = new os.filter.FilterEntry();
    var fn = os.ui.filter.fn.createFromEntry(emptyEntry);
    expect(goog.isFunction(fn)).toBe(true);
    expect(fn(testObj)).toBe(false);

    // create a function from the AND filter
    fn = os.ui.filter.fn.createFromEntry(andEntry);
    expect(goog.isFunction(fn)).toBe(true);

    // all values match
    expect(fn(testObj)).toBe(true);

    // changing any AND value results in no match
    testObj['AND1'] = 'notValue1';
    expect(fn(testObj)).toBe(false);

    testObj['AND1'] = 'value1';
    expect(fn(testObj)).toBe(true);

    testObj['AND2'] = 'notValue2';
    expect(fn(testObj)).toBe(false);

    testObj['AND2'] = 'value2';
    expect(fn(testObj)).toBe(true);

    testObj['AND3'] = 'notValue3';
    expect(fn(testObj)).toBe(false);

    // create a function from the OR filter
    fn = os.ui.filter.fn.createFromEntry(orEntry);
    expect(goog.isFunction(fn)).toBe(true);
    expect(fn(testObj)).toBe(true);

    // function matches until all OR values are changed
    testObj['OR1'] = 'notValue4';
    expect(fn(testObj)).toBe(true);

    testObj['OR2'] = 'notValue5';
    expect(fn(testObj)).toBe(true);

    testObj['OR3'] = 'notValue6';
    expect(fn(testObj)).toBe(false);

    // create a function from the OR filter
    fn = os.ui.filter.fn.createFromEntry(notEntry);
    expect(goog.isFunction(fn)).toBe(true);
    expect(fn(testObj)).toBe(true);

    // function matches until all OR values are changed
    testObj['NOT1'] = null;
    expect(fn(testObj)).toBe(false);

    testObj['NOT1'] = '';
    expect(fn(testObj)).toBe(false);

    testObj['NOT1'] = 'notNull';
    expect(fn(testObj)).toBe(true);
  });

  it('should not create filter function strings from an empty condition node', function() {
    var node = goog.dom.xml.loadXml('<And></And>').firstChild;
    expect(os.ui.filter.fn.getNodeExpression(node, {})).toBe('');
  });

  it('should not create filter function strings from an expression node without an op', function() {
    var xml = '<UnknownOp><PropertyName>KEY</PropertyName><Literal>value</Literal></UnknownOp>';
    var node = goog.dom.xml.loadXml(xml).firstChild;
    expect(os.ui.filter.fn.getNodeExpression(node, {'KEY': 'v0'})).toBe('');
  });

  it('should not create filter function strings from an expression node without a column name', function() {
    var xml = '<PropertyIsEqualTo><PropertyName></PropertyName><Literal>value</Literal></PropertyIsEqualTo>';
    var node = goog.dom.xml.loadXml(xml).firstChild;
    expect(os.ui.filter.fn.getNodeExpression(node, {})).toBe('');

    xml = '<PropertyIsEqualTo><Literal>value</Literal></PropertyIsEqualTo>';
    node = goog.dom.xml.loadXml(xml).firstChild;
    expect(os.ui.filter.fn.getNodeExpression(node, {})).toBe('');
  });
});

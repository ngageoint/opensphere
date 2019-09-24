goog.require('os.ui.filter.op.IsTrue');

describe('os.ui.filter.op.IsTrue', function() {
  var op = new os.ui.filter.op.IsTrue();

  it('should return the correct configs', function() {
    expect(op.getUi()).toBe('span');
  });

  it('should generate the proper filter function expression', function() {
    // literal doesn't affect the expression
    var expr = '(!(typeof v==="undefined"||v==null||v.length==0)&&(v===true||v==1||(""+v).toLowerCase()=="true"))';

    expect(op.getEvalExpression('v', null)).toBe(expr);
    expect(op.getEvalExpression('v', '')).toBe(expr);
    expect(op.getEvalExpression('v', 'noop')).toBe(expr);
  });

  it('should generate the proper filter function xml', function() {
    // literal doesn't affect the expression
    var expr = '<And hint="os.ui.filter.op.IsTrue">' +
        '<Not><PropertyIsNull><PropertyName>v</PropertyName></PropertyIsNull></Not>' +
        '<Or>' +
        '<PropertyIsEqualTo><PropertyName>v</PropertyName><Literal><![CDATA[1]]></Literal></PropertyIsEqualTo>' +
        '<PropertyIsEqualTo matchCase="false">' +
        '<PropertyName>v</PropertyName><Literal><![CDATA[true]]></Literal>' +
        '</PropertyIsEqualTo>' +
        '</Or>' +
        '</And>';

    expect(op.getFilter('v', null)).toBe(expr);
    expect(op.getFilter('v', '')).toBe(expr);
    expect(op.getFilter('v', 'noop')).toBe(expr);
  });

  it('should evaluate variables as desired', function() {
    var expr = op.getEvalExpression('v', 'noop');
    var v = null;

    // prevent eslint no-unused-vars
    expect(v).toBeDefined();

    // null/undefined, empty strings, and values of false should be false
    expect(eval(expr)).toBe(false);

    v = undefined;
    expect(eval(expr)).toBe(false);

    v = NaN;
    expect(eval(expr)).toBe(false);

    v = [];
    expect(eval(expr)).toBe(false);

    v = '';
    expect(eval(expr)).toBe(false);

    v = {};
    expect(eval(expr)).toBe(false);

    v = 'DC';  //testing non-empty does not follow 'coding' logic that evaluates to true
    expect(eval(expr)).toBe(false);

    v = 0;
    expect(eval(expr)).toBe(false);

    v = false;
    expect(eval(expr)).toBe(false);

    //specific values allowed; should be true
    v = 'TRUE';
    expect(eval(expr)).toBe(true);

    v = 1;
    expect(eval(expr)).toBe(true);

    v = true;
    expect(eval(expr)).toBe(true);

  });
});

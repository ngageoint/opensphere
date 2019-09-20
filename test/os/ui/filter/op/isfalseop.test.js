goog.require('os.ui.filter.op.IsFalse');

describe('os.ui.filter.op.IsFalse', function() {
  var op = new os.ui.filter.op.IsFalse();

  it('should return the correct configs', function() {
    expect(op.getUi()).toBe('span');
  });

  it('should generate the proper filter function expression', function() {
    // literal doesn't affect the expression
    var expr = '(!(typeof v==="undefined"||v==null||v.length==0)&&(v===false||v==0||(""+v).toLowerCase()=="false"))';

    expect(op.getEvalExpression('v', null)).toBe(expr);
    expect(op.getEvalExpression('v', '')).toBe(expr);
    expect(op.getEvalExpression('v', 'noop')).toBe(expr);
  });

  it('should evaluate variables as desired', function() {
    var expr = op.getEvalExpression('v', 'noop');
    var v = null;
  
    // prevent eslint no-unused-vars
    expect(v).toBeDefined();

    // null/undefined, empty strings and values should be false (because boolean also supports "isEmpty")
    expect(eval(expr)).toBe(false);

    v = undefined;
    expect(eval(expr)).toBe(false);

    v = NaN;
    expect(eval(expr)).toBe(false);

    v = [];
    expect(eval(expr)).toBe(false);

    v = '';
    expect(eval(expr)).toBe(false);

    v = 1;
    expect(eval(expr)).toBe(false);

    v = true;
    expect(eval(expr)).toBe(false);

    //specific values allowed; should be true
    v = 'FALSE';
    expect(eval(expr)).toBe(true);

    v = 0;
    expect(eval(expr)).toBe(true);

    v = false;
    expect(eval(expr)).toBe(true);

  });
});

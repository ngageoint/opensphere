goog.require('os.histo.Bin');
goog.require('os.histo.FilterComponent');
goog.require('os.histo.UniqueBinMethod');

describe('os.histo.UniqueBinMethod', function() {
  var method = new os.histo.UniqueBinMethod();
  method.setField('field');

  it('should get the correct string key', function() {
    var item = {field: 'Tada!'};
    var value = method.getValue(item);
    var key = method.getBinKey(value);

    expect(key).toBe(value);
    expect(key).toBe('Tada!');
  });

  it('should get the correct numeric key', function() {
    var item = {field: 10};
    var value = method.getValue(item);
    var key = method.getBinKey(value);

    expect(key).toBe(value);
    expect(key).toBe('10');
  });

  it('should get the correct null/undefined key and label', function() {
    var value = method.getValue({});
    var key = method.getBinKey(value);
    var label = method.getBinLabel(value);

    expect(key).toBe(value);
    expect(key).toBe(label);
    expect(key).toBe('No field');

    var value = method.getValue({field: null});
    var key = method.getBinKey(value);
    var label = method.getBinLabel(value);

    expect(key).toBe(value);
    expect(key).toBe(label);
    expect(key).toBe('No field');
  });

  it('should filter dimensions correctly', function() {
    var data = [
      {field: 1},
      {field: 10},
      {field: 100}
    ];

    var xf = crossfilter(data);
    var dim = xf.dimension(function(d) {
      return d.field;
    });
    var item = data[1];
    method.filterDimension(dim, item);

    var list = dim.top(Infinity);
    expect(list.length).toBe(1);
    expect(list[0]).toBe(item);
  });

  it('should export to filter correctly', function() {
    var orHeader = '<Or>';
    var orFooter = '</Or>';
    var emptyFilter = os.histo.FilterComponent.IS_EMPTY_HEAD + 'field' + os.histo.FilterComponent.IS_EMPTY_TAIL;

    // no bins to export
    expect(method.exportAsFilter([])).toBe('');

    // invalid bin isn't exported
    var invalidBin = new os.histo.Bin();
    invalidBin.setKey(os.histo.UniqueBinMethod.INVALID_VALUE);
    expect(method.exportAsFilter([invalidBin])).toBe('');

    // empty filter created correctly. single filter does not wrap in an Or block.
    var emptyBin = new os.histo.Bin();
    emptyBin.setKey('No field');
    expect(method.exportAsFilter([emptyBin])).toBe(emptyFilter);

    // bin with a value is exported. single filter does not wrap in an Or block.
    var valueBin = new os.histo.Bin();
    var theValue = 'TEST VALUE';
    valueBin.setKey(theValue);
    valueBin.setLabel(theValue);

    var equalFilter = os.histo.FilterComponent.IS_EQUAL_HEAD + 'field' + os.histo.FilterComponent.IS_EQUAL_MID +
        theValue + os.histo.FilterComponent.IS_EQUAL_TAIL;
    expect(method.exportAsFilter([valueBin])).toBe(equalFilter);

    // exports multiple bins, wrapped in an Or block
    expect(method.exportAsFilter([emptyBin, valueBin]))
        .toBe(orHeader + emptyFilter + equalFilter + orFooter);

    // ignores invalid bins but still exports valid bins
    expect(method.exportAsFilter([invalidBin, emptyBin, valueBin]))
        .toBe(orHeader + emptyFilter + equalFilter + orFooter);
  });

  it('should clone correctly', function() {
    var fn = function(value) {
      return 'hi';
    };
    method.setValueFunction(fn);

    var clone = method.clone();
    expect(clone.getField()).toBe('field');
    expect(clone.valueFunction).toBe(fn);
  });

  it('should restore correctly', function() {
    var method = new os.histo.UniqueBinMethod();
    method.setField('field');

    // if the field isn't set, don't change it
    method.restore({});
    expect(method.getField()).toBe('field');

    method.restore({
      field: null
    });
    expect(method.getField()).toBe('field');

    // sets the field if the value is a string
    method.restore({
      field: ''
    });
    expect(method.getField()).toBe('');

    method.restore({
      field: 'otherField'
    });
    expect(method.getField()).toBe('otherField');
  });
});

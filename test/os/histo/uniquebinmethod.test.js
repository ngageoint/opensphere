goog.require('os.data.histo.ColorBin');
goog.require('os.histo.Bin');
goog.require('os.histo.FilterComponent');
goog.require('os.histo.UniqueBinMethod');

describe('os.histo.UniqueBinMethod', function() {
  const {default: ColorBin} = goog.module.get('os.data.histo.ColorBin');
  const {default: Bin} = goog.module.get('os.histo.Bin');
  const {default: FilterComponent} = goog.module.get('os.histo.FilterComponent');
  const {default: UniqueBinMethod} = goog.module.get('os.histo.UniqueBinMethod');

  var method = new UniqueBinMethod();
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
    var emptyFilter = FilterComponent.IS_EMPTY_HEAD + 'field' + FilterComponent.IS_EMPTY_TAIL;

    // no bins to export
    expect(method.exportAsFilter([])).toBe('');

    // invalid bin isn't exported
    var invalidBin = new Bin();
    invalidBin.setKey(UniqueBinMethod.INVALID_VALUE);
    expect(method.exportAsFilter([invalidBin])).toBe('');

    // empty filter created correctly. single filter does not wrap in an Or block.
    var emptyBin = new Bin();
    emptyBin.setKey('No field');
    expect(method.exportAsFilter([emptyBin])).toBe(emptyFilter);

    // bin with a value is exported. single filter does not wrap in an Or block.
    var valueBin = new Bin();
    var theValue = 'TEST VALUE';
    valueBin.setKey(theValue);
    valueBin.setLabel(theValue);

    var equalFilter = FilterComponent.IS_EQUAL_HEAD + 'field' + FilterComponent.IS_EQUAL_MID +
        theValue + FilterComponent.IS_EQUAL_TAIL;
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
    method.setShowEmptyBins(true);
    method.setMaxBins(1);

    var clone = method.clone();
    expect(clone.getField()).toBe('field');
    expect(clone.getShowEmptyBins()).toBe(true);
    expect(clone.getMaxBins()).toBe(1);
    expect(clone.valueFunction).toBe(fn);
  });

  it('should restore correctly', function() {
    var method = new UniqueBinMethod();
    method.setField('field');

    // if the field isn't set, don't change it
    method.restore({});
    expect(method.getField()).toBe('field');
    expect(method.getShowEmptyBins()).toBe(false);
    expect(method.getMaxBins()).toBe(Infinity);

    method.restore({
      field: null
    });
    expect(method.getField()).toBe('field');
    expect(method.getShowEmptyBins()).toBe(false);
    expect(method.getMaxBins()).toBe(Infinity);

    // sets the field if the value is a string
    method.restore({
      field: '',
      showEmptyBins: true,
      maxBins: '1'
    });
    expect(method.getField()).toBe('');
    expect(method.getShowEmptyBins()).toBe(true);
    expect(method.getMaxBins()).toBe(1);

    method.restore({
      field: 'otherField',
      showEmptyBins: false,
      maxBins: 'not a number' // does not override the '1' provided before
    });
    expect(method.getField()).toBe('otherField');
    expect(method.getShowEmptyBins()).toBe(false);
    expect(method.getMaxBins()).toBe(1);
  });

  it('should provide bins statistics', function() {
    var method = new UniqueBinMethod();
    method.setField('field');

    var min = 0;
    var max = 4;
    var bins = [];
    var bin;

    bin = new ColorBin('#000');
    bin['key'] = min;
    bin['label'] = method.getLabelForKey(min);
    bin['id'] = bin['label'];
    bin['series'] = '';
    bin['count'] = 0;
    bin['sel'] = false;
    bin['highlight'] = false;
    bins.push(bin);

    bin = new ColorBin('#000');
    bin['key'] = max;
    bin['label'] = method.getLabelForKey(max);
    bin['id'] = bin['label'];
    bin['series'] = '';
    bin['count'] = 0;
    bin['sel'] = false;
    bin['highlight'] = false;
    bins.push(bin);

    var stats = method.getStatsForBin(bins);
    expect(stats.range[0]).toBe(min);
    expect(stats.range[1]).toBe(max);
    expect(stats.binCount).toBe(2);
    expect(stats.binCountAll).toBe(5);
  });
});

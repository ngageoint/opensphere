goog.require('os.data.histo.ColorBin');
goog.require('os.histo.Bin');
goog.require('os.histo.FilterComponent');
goog.require('os.histo.NumericBinMethod');
goog.require('os.histo.bin');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');


describe('os.histo.NumericBinMethod', function() {
  const {default: ColorBin} = goog.module.get('os.data.histo.ColorBin');
  const {default: Bin} = goog.module.get('os.histo.Bin');
  const {default: FilterComponent} = goog.module.get('os.histo.FilterComponent');
  const {default: NumericBinMethod} = goog.module.get('os.histo.NumericBinMethod');
  const osHistoBin = goog.module.get('os.histo.bin');
  const {default: TimeInstant} = goog.module.get('os.time.TimeInstant');
  const {default: TimeRange} = goog.module.get('os.time.TimeRange');

  var method = new NumericBinMethod();
  method.setField('field');

  it('should get the correct numeric keys with default offset', function() {
    var items = [
      {field: -15},
      {field: -10},
      {field: -5},
      {field: 0},
      {field: 5},
      {field: 10},
      {field: 15}
    ];

    var expected = [-20, -10, -10, 0, 0, 10, 10];
    for (var i = 0, n = items.length; i < n; i++) {
      expect(method.getBinKey(method.getValue(items[i]))).toBe(expected[i]);
    }
  });

  it('should label the items with the appropriate range', function() {
    var items = [
      {field: 30}, {field: 31}, {field: 32},
      {field: 200}, {field: 201}, {field: 202},
      {field: 1000}, {field: 1001}, {field: 1002}
    ];

    var expected = ['30 to 40', '30 to 40', '30 to 40',
      '200 to 210', '200 to 210', '200 to 210',
      '1000 to 1010', '1000 to 1010', '1000 to 1010'];
    for (var i = 0, n = items.length; i < n; i++) {
      expect(method.getBinLabel(items[i])).toBe(expected[i]);
    }
  });

  it('should handle tiny widths without floating point errors', function() {
    for (var width = 0.01; Math.abs(width - 1E-9) > 1E-12; width /= 10) {
      method.setWidth(width);

      for (var num = 1540, max = 1540 + 100 * width; num < max; num += width / 2) {
        var key = method.getBinKey(num);
        expect(Math.abs(num - key) < width).toBe(true);
      }
    }

    method.setWidth(10);
  });

  it('should always use the max precision of width and offset in the label', function() {
  });

  it('should return the magic number for non-numeric inputs', function() {
    var method = new NumericBinMethod();
    method.valueFunction = function(val) {
      return val;
    };

    // value is empty
    expect(method.getValue(undefined)).toBe(osHistoBin.MAGIC_EMPTY);
    expect(method.getValue(null)).toBe(osHistoBin.MAGIC_EMPTY);
    expect(method.getValue('')).toBe(osHistoBin.MAGIC_EMPTY);

    // value is not a number
    expect(method.getValue(NaN)).toBe(osHistoBin.MAGIC_NAN);

    expect(method.getValue(true)).toBe(osHistoBin.MAGIC_NAN);
    expect(method.getValue(false)).toBe(osHistoBin.MAGIC_NAN);

    expect(method.getValue('not a number')).toBe(osHistoBin.MAGIC_NAN);
    expect(method.getValue('1 1')).toBe(osHistoBin.MAGIC_NAN);
    expect(method.getValue('0x0g')).toBe(osHistoBin.MAGIC_NAN);
    expect(method.getValue('4/2')).toBe(osHistoBin.MAGIC_NAN);
    expect(method.getValue('#2a')).toBe(osHistoBin.MAGIC_NAN);

    expect(method.getValue([])).toBe(osHistoBin.MAGIC_NAN);
    expect(method.getValue({})).toBe(osHistoBin.MAGIC_NAN);
    expect(method.getValue(function() {})).toBe(osHistoBin.MAGIC_NAN);
  });

  it('should return a number for numeric inputs', function() {
    var method = new NumericBinMethod();
    method.valueFunction = function(val) {
      return val;
    };

    expect(method.getValue(42)).toBe(42);

    var date = new Date();
    expect(method.getValue(date)).toBe(date.getTime());

    var instant = new TimeInstant(date.getTime());
    expect(method.getValue(instant)).toBe(date.getTime());

    var range = new TimeRange(date.getTime(), date.getTime() + 1000);
    expect(method.getValue(range)).toBe(date.getTime());

    expect(method.getValue('42')).toBe(42);
    expect(method.getValue('4.2')).toBe(4.2);
    expect(method.getValue('-4.2')).toBe(-4.2);
    expect(method.getValue('0x2a')).toBe(42);
    expect(method.getValue('42e2')).toBe(4200);
  });

  it('should get the correct null/undefined key and label', function() {
    var value = method.getValue({});
    var key = method.getBinKey(value);
    var label = method.getBinLabel(value);

    expect(key).toBe(value);
    expect(key).toBe(osHistoBin.MAGIC_EMPTY);
    expect(label).toBe('No field');

    value = method.getValue({field: null});
    key = method.getBinKey(value);
    label = method.getBinLabel(value);

    expect(key).toBe(value);
    expect(key).toBe(osHistoBin.MAGIC_EMPTY);
    expect(label).toBe('No field');
  });

  it('should get the correct NaN key and label', function() {
    var item = {field: NaN};
    var value = method.getValue(item);
    var key = method.getBinKey(value);
    var label = method.getBinLabel(item);

    expect(key).toBe(value);
    expect(key).toBe(osHistoBin.MAGIC_NAN);
    expect(label).toBe(NumericBinMethod.NAN_LABEL);

    item = {field: {}};
    value = method.getValue(item);
    key = method.getBinKey(value);
    label = method.getBinLabel(item);

    expect(key).toBe(value);
    expect(key).toBe(osHistoBin.MAGIC_NAN);
    expect(label).toBe(NumericBinMethod.NAN_LABEL);
  });

  it('should filter dimensions correctly', function() {
    var items = [
      {field: -15},
      {field: -10},
      {field: -5},
      {field: 0},
      {field: 5},
      {field: 10},
      {field: 15}
    ];

    var xf = crossfilter(items);
    var dim = xf.dimension(function(d) {
      return d.field;
    });
    method.filterDimension(dim, items[0]);
    var results = dim.top(Infinity);

    expect(results.length).toBe(1);
    expect(results[0]).toBe(items[0]);

    method.filterDimension(dim, items[4]);
    results = dim.top(Infinity);

    expect(results.length).toBe(2);
    expect(results[1]).toBe(items[3]);
    expect(results[0]).toBe(items[4]);
  });

  it('should export to filter correctly', function() {
    var width = 10;
    var offset = 0;
    method.setWidth(width);
    method.setOffset(offset);

    var orHeader = '<Or>';
    var orFooter = '</Or>';

    var gtHeader = '<And hint="between">' + FilterComponent.GT_HEAD + 'field' +
        FilterComponent.GT_MID;
    var gtFooter = FilterComponent.GT_TAIL;

    var ltHeader = FilterComponent.LT_HEAD + 'field' + FilterComponent.LT_MID;
    var ltFooter = FilterComponent.LT_TAIL + '</And>';

    var emptyFilter = FilterComponent.IS_EMPTY_HEAD + 'field' + FilterComponent.IS_EMPTY_TAIL;

    // no bins to export
    expect(method.exportAsFilter([])).toBe('');

    // "not a number" bin isn't exported
    var nanBin = new Bin();
    nanBin.setKey(osHistoBin.MAGIC_NAN);
    expect(method.exportAsFilter([nanBin])).toBe('');

    // empty filter created correctly. single filter does not wrap in an Or block.
    var emptyBin = new Bin();
    emptyBin.setKey(osHistoBin.MAGIC_EMPTY);
    expect(method.exportAsFilter([emptyBin])).toBe(emptyFilter);

    // bin with a value is exported. single filter does not wrap in an Or block.
    var valueBin = new Bin();
    var theValue = 42;
    valueBin.setKey(theValue);

    var valueFilter = gtHeader + theValue + gtFooter + ltHeader + (theValue + width) + ltFooter;
    expect(method.exportAsFilter([valueBin])).toBe(valueFilter);

    // exports multiple bins, wrapped in an Or block
    expect(method.exportAsFilter([emptyBin, valueBin])).toBe(orHeader + emptyFilter + valueFilter + orFooter);

    // ignores nan bins but still exports valid bins
    expect(method.exportAsFilter([nanBin, emptyBin, valueBin])).toBe(orHeader + emptyFilter + valueFilter + orFooter);
  });

  it('should clone correctly', function() {
    var fn = function(value) {
      return value;
    };
    method.setValueFunction(fn);
    method.setWidth(55);
    method.setOffset(14);
    method.setShowEmptyBins(true);

    var clone = method.clone();
    expect(clone.getField()).toBe('field');
    expect(clone.valueFunction).toBe(fn);
    expect(clone.getWidth()).toBe(55);
    expect(clone.getOffset()).toBe(14);
    expect(clone.getShowEmptyBins()).toBe(true);
  });

  it('should restore correctly', function() {
    var method = new NumericBinMethod();

    // doesn't change width/offset if they aren't set on the restore object
    var oldWidth = method.getWidth();
    var oldOffset = method.getOffset();
    var oldShowEmptyBins = method.getShowEmptyBins();
    method.restore({});

    expect(method.getWidth()).toBe(oldWidth);
    expect(method.getOffset()).toBe(oldOffset);
    expect(method.getShowEmptyBins()).toBe(oldShowEmptyBins);

    // or if the values are non-numeric
    method.restore({
      'width': null,
      'offset': null
    });

    expect(method.getWidth()).toBe(oldWidth);
    expect(method.getOffset()).toBe(oldOffset);
    expect(method.getShowEmptyBins()).toBe(oldShowEmptyBins);

    method.restore({
      'width': 'not numeric',
      'offset': 'not numeric'
    });

    expect(method.getWidth()).toBe(oldWidth);
    expect(method.getOffset()).toBe(oldOffset);
    expect(method.getShowEmptyBins()).toBe(oldShowEmptyBins);

    // does change them if they are set
    method.restore({
      'width': 12,
      'offset': 34,
      'showEmptyBins': true
    });

    expect(method.getWidth()).toBe(12);
    expect(method.getOffset()).toBe(34);
    expect(method.getShowEmptyBins()).toBe(true);

    // converts numeric strings to numbers
    method.restore({
      'width': '56',
      'offset': '78',
      'showEmptyBins': false
    });

    expect(method.getWidth()).toBe(56);
    expect(method.getOffset()).toBe(78);
    expect(method.getShowEmptyBins()).toBe(false);
  });

  it('should provide bins statistics', function() {
    var method = new NumericBinMethod();
    method.setField('field');
    method.setWidth(5);

    var min = 0;
    var max = 40;
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
    expect(stats.binCountAll).toBe(9);
  });
});

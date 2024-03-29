goog.require('os.data.histo.ColorBin');
goog.require('os.histo.DateBinMethod');
goog.require('os.histo.DateBinType');
goog.require('os.histo.DateRangeBinType');
goog.require('os.histo.bin');
goog.require('os.time');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');


describe('os.histo.DateBinMethod', function() {
  const {default: ColorBin} = goog.module.get('os.data.histo.ColorBin');
  const {default: DateBinMethod} = goog.module.get('os.histo.DateBinMethod');
  const {default: DateBinType} = goog.module.get('os.histo.DateBinType');
  const {default: DateRangeBinType} = goog.module.get('os.histo.DateRangeBinType');
  const osHistoBin = goog.module.get('os.histo.bin');
  const time = goog.module.get('os.time');
  const {default: TimeInstant} = goog.module.get('os.time.TimeInstant');
  const {default: TimeRange} = goog.module.get('os.time.TimeRange');

  var method = new DateBinMethod();
  method.setField('field');
  method.setDateBinType(DateBinType.UNIQUE);

  var valueSpy;

  beforeEach(function() {
    valueSpy = jasmine.createSpyObj('value', ['getStart', 'getEnd']);
  });

  it('should convert all manner of time values to millis since epoch', function() {
    // here's a bunch of different ways of saying the same thing
    var d = new Date();
    d.setUTCFullYear(2014, 0, 30);
    d.setUTCHours(12, 34, 56, 0);

    // The timezone offset is in minutes, so convert that to millis.
    expect(method.getValue({field: '2014-01-30 12:34:56'})).toBe(new Date(2014, 0, 30, 12, 34, 56, 0).getTime());

    var utcItems = [
      {field: '2014-01-30T12:34:56Z'},
      {field: '2014-01-30T12:34:56+0000'},
      {field: d},
      {field: new TimeInstant(d.getTime())},
      {field: new TimeRange(d.getTime(), d.getTime())},
      {field: d.toISOString()}
    ];
    for (var i = 0, n = utcItems.length; i < n; i++) {
      expect(method.getValue(utcItems[i])).toBe(d.getTime());
    }
  });

  it('should convert time values that are deprecated by moment, but still supported', function() {
    var d = new Date();
    d.setUTCFullYear(2014, 0, 30);
    d.setUTCHours(12, 34, 56, 0);

    // Values that are supported but deprecated by moment. If these tests start failing, move them to the unsupported
    // test.
    var deprecatedItems = [
      {field: '01/30/2014 12:34:56 UTC'},
      {field: d.toString()}
    ];

    for (var i = 0, n = deprecatedItems.length; i < n; i++) {
      expect(method.getValue(deprecatedItems[i])).toBe(d.getTime());
    }
  });

  it('should not convert time values that are not supported by moment', function() {
    var d = new Date();
    d.setUTCFullYear(2014, 0, 30);
    d.setUTCHours(12, 34, 56, 0);

    // Values that are unsupported by moment
    var unsupportedItems = [
      {field: '30/01/2014 12:34:56 UTC'}
    ];

    for (var i = 0, n = unsupportedItems.length; i < n; i++) {
      expect(method.getValue(unsupportedItems[i])).toBe(DateBinMethod.MAGIC);
    }
  });

  it('should bin uniquely', function() {
    method.setDateBinType(DateBinType.UNIQUE);
    var items = [
      {field: '2014-01-30T12:34:56Z'},
      {field: '2014-01-30T12:34:30+0000'},
      {field: 'gibberish'},
      {field: ''},
      {field: null},
      {}];

    var values = items.map(method.getValue, method);
    var expected = [1391085296000, 1391085270000,
      DateBinMethod.MAGIC, DateBinMethod.MAGIC,
      DateBinMethod.MAGIC, DateBinMethod.MAGIC];

    var expectedLabels = ['2014-01-30T12:34:56Z', '2014-01-30T12:34:30Z',
      'Invalid Date', 'Invalid Date', 'Invalid Date', 'Invalid Date'];

    for (var i = 0, n = values.length; i < n; i++) {
      expect(method.getBinKey(values[i])).toBe(expected[i]);
      expect(method.getBinLabel(items[i])).toBe(expectedLabels[i]);
    }
  });

  it('should bin by hour', function() {
    method.setDateBinType(DateBinType.HOUR);

    var items = [
      {field: '2014-01-30T12:34:56Z'},
      {field: '2014-01-30T13:35:30+0000'},
      {field: 'gibberish'}];

    var values = items.map(method.getValue, method);

    var expected = [1391083200000, 1391086800000, DateBinMethod.MAGIC];
    var expectedLabels = ['2014-01-30 12', '2014-01-30 13', 'Invalid Date'];

    for (var i = 0, n = values.length; i < n; i++) {
      expect(method.getBinKey(values[i])).toBe(expected[i]);
      expect(method.getBinLabel(items[i])).toBe(expectedLabels[i]);
    }
  });

  it('should bin by hour of day', function() {
    method.setDateBinType(DateBinType.HOUR_OF_DAY);

    var items = [
      {field: '2014-01-30T12:34:56Z'},
      {field: '2014-01-30T13:35:30+0000'},
      {field: 'gibberish'}];

    var values = items.map(method.getValue, method);
    var expected = [12, 13, DateBinMethod.MAGIC];
    var expectedLabels = ['1200', '1300', 'Invalid Date'];

    for (var i = 0, n = values.length; i < n; i++) {
      expect(method.getBinKey(values[i])).toBe(expected[i]);
      expect(method.getBinLabel(items[i])).toBe(expectedLabels[i]);
    }
  });

  it('should bin by day', function() {
    method.setDateBinType(DateBinType.DAY);

    var items = [
      {field: '2014-01-30T12:34:56Z'},
      {field: '2014-01-31T13:35:30+0000'},
      {field: 'gibberish'}];

    var values = items.map(method.getValue, method);
    var expected = [1391040000000, 1391126400000, DateBinMethod.MAGIC];
    var expectedLabels = ['2014-01-30', '2014-01-31', 'Invalid Date'];

    for (var i = 0, n = values.length; i < n; i++) {
      expect(method.getBinKey(values[i])).toBe(expected[i]);
      expect(method.getBinLabel(items[i])).toBe(expectedLabels[i]);
    }
  });

  it('should bin by day of week', function() {
    method.setDateBinType(DateBinType.DAY_OF_WEEK);

    var items = [
      {field: '2014-01-30T12:34:56Z'},
      // This date is on the 30th in Local, but on the 31st in UTC.
      {field: '2014-01-31T01:00:00Z'},
      {field: '2014-01-31T13:35:30+0000'},
      {field: 'gibberish'}];

    var values = items.map(method.getValue, method);
    var expected = [4, 5, 5, DateBinMethod.MAGIC];
    var expectedLabels = ['Thursday', 'Friday', 'Friday', 'Invalid Date'];

    for (var i = 0, n = values.length; i < n; i++) {
      expect(method.getBinKey(values[i])).toBe(expected[i]);
      expect(method.getBinLabel(items[i])).toBe(expectedLabels[i]);
    }
  });

  it('should bin by week', function() {
    method.setDateBinType(DateBinType.WEEK);

    var items = [
      {field: '2014-01-23T12:34:56Z'},
      {field: '2014-01-31T13:35:30+0000'},
      {field: 'gibberish'}];

    var values = items.map(method.getValue, method);
    var expected = [1390089600000, 1390694400000, DateBinMethod.MAGIC];
    var expectedLabels = ['2014-01-19', '2014-01-26', 'Invalid Date'];

    for (var i = 0, n = values.length; i < n; i++) {
      expect(method.getBinKey(values[i])).toBe(expected[i]);
      expect(method.getBinLabel(items[i])).toBe(expectedLabels[i]);
    }
  });

  it('should bin by month', function() {
    method.setDateBinType(DateBinType.MONTH);

    var items = [
      {field: '2014-01-23T12:34:56Z'},
      {field: '2014-02-19T12:35:30+0000'},
      {field: 'gibberish'}];

    var values = items.map(method.getValue, method);
    var expected = [1388534400000, 1391212800000, DateBinMethod.MAGIC];
    var expectedLabels = ['2014-01', '2014-02', 'Invalid Date'];

    for (var i = 0, n = values.length; i < n; i++) {
      expect(method.getBinKey(values[i])).toBe(expected[i]);
      expect(method.getBinLabel(items[i])).toBe(expectedLabels[i]);
    }
  });

  it('should bin by year', function() {
    method.setDateBinType(DateBinType.YEAR);

    var items = [
      {field: '2014-01-23T12:34:56Z'},
      {field: '2013-01-31T13:35:30+0000'},
      {field: 'gibberish'}];

    var values = items.map(method.getValue, method);
    var expected = [1388534400000, 1356998400000, DateBinMethod.MAGIC];
    var expectedLabels = ['2014', '2013', 'Invalid Date'];

    for (var i = 0, n = values.length; i < n; i++) {
      expect(method.getBinKey(values[i])).toBe(expected[i]);
      expect(method.getBinLabel(items[i])).toBe(expectedLabels[i]);
    }
  });

  it('should bin by month of year', function() {
    method.setDateBinType(DateBinType.MONTH_OF_YEAR);

    var items = [
      {field: '2014-01-31T12:34:56Z'},
      {field: '2014-02-01T01:00:00Z'},
      {field: '2014-01-31T13:35:30+0000'},
      {field: 'gibberish'}];

    var values = items.map(method.getValue, method);
    var expected = ['0', 1, '0', DateBinMethod.MAGIC];
    var expectedLabels = ['January', 'February', 'January', 'Invalid Date'];

    for (var i = 0, n = values.length; i < n; i++) {
      expect(method.getBinKey(values[i])).toEqual(expected[i]);
      expect(method.getBinLabel(items[i])).toBe(expectedLabels[i]);
    }
  });

  it('should bin by month of year with keys', function() {
    method.setDateBinType(DateBinType.MONTH_OF_YEAR);
    var item = {field: '2014-01-31T12:34:56Z'};
    var expected = [0];
    method.arrayKeys = true;

    var value = method.getValue(item);
    expect(value).toEqual(expected);
  });

  it('shold bin by month of year across a range', function() {
    method.setDateBinType(DateBinType.MONTH_OF_YEAR);
    var d1 = new Date('2014-01-11T12:34:56Z').getTime();
    var d2 = new Date('2014-02-11T12:34:56Z').getTime();

    valueSpy.getStart.andReturn(d1);
    valueSpy.getEnd.andReturn(d2);
    spyOn(method, 'valueFunction').andReturn(valueSpy);
    method.arrayKeys = true;

    var result = method.getValue(true);

    expect(result.length).toBe(2);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(1);
  });

  it('should restore correctly', function() {
    var method = new DateBinMethod();
    method.setDateBinType(DateBinType.UNIQUE);

    // if the bin type isn't set, don't change it
    method.restore({});
    expect(method.getDateBinType()).toBe(DateBinType.UNIQUE);

    method.restore({
      binType: null
    });
    expect(method.getDateBinType()).toBe(DateBinType.UNIQUE);

    // if the bin type isn't known, don't change it
    method.restore({
      binType: 'SomeUnknownType'
    });
    expect(method.getDateBinType()).toBe(DateBinType.UNIQUE);

    // sets the bin type if the value is a known type
    method.restore({
      binType: DateBinType.MINUTE
    });
    expect(method.getDateBinType()).toBe(DateBinType.MINUTE);

    method.restore({
      binType: DateBinType.HOUR
    });
    expect(method.getDateBinType()).toBe(DateBinType.HOUR);
  });

  it('should map types to range types', function() {
    var expectedLength = Object.keys(DateBinType).length;
    var resultLength = Object.keys(DateRangeBinType).length;

    expect(resultLength).toBe(expectedLength);
  });

  it('should provide sort label by key ascending', function() {
    var method = new DateBinMethod();
    expect(method.getSortLabelFnAsc()).toBe(osHistoBin.sortByKey);
  });

  it('should provide sort label by key descending', function() {
    var method = new DateBinMethod();
    expect(method.getSortLabelFnDesc()).toBe(osHistoBin.sortByKeyDesc);
  });

  it('should return simple values for simple input when calling generateValues()', function() {
    var method = new DateBinMethod();
    var result;

    method.arrayKeys = true;
    result = method.generateValues(1, 1, 1);
    expect(result).toEqual([1]);

    method.arrayKeys = false;
    result = method.generateValues(1, 1, 1);
    expect(result).toEqual(1);
  });

  it('should return the value passed to getBinKey() if the input value is an array', function() {
    var method = new DateBinMethod();
    var result = method.getBinKey([1]);

    expect(result).toEqual([1]);
  });

  it('should return the value passed to getBinKey() if the input value is not an array', function() {
    var method = new DateBinMethod();
    var result;

    result = method.getBinKey('123123');
    expect(result).toEqual(123123);

    result = method.getBinKey('123abc');
    expect(result).toEqual('123abc');
  });


  it('should provide bins statistics', function() {
    var method = new DateBinMethod();
    method.setField('field');
    method.setDateBinType(DateBinType.MONTH);

    var minDate = new Date(2020, 0, 3); // Jan 3, 2020 >> Jan 2020
    var maxDate = new Date(2030, 0, 15); // Jan 15, 2030 >> Jan 2030
    var min = time.floor(minDate, 'month').getTime();
    var max = time.floor(maxDate, 'month').getTime();
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
    // Note: see sourcemodel.js > generateEmptyBins_() for example of how to use MAGIC_MONTH_MILLIS and os.time.step()
    expect(stats.binCountAll).toBe(121);

    minDate = new Date(2019, 1, 12); // Feb 12 >> Feb
    maxDate = new Date(2019, 2, 1); // Mar 1 >> Mar
    min = time.floor(minDate, 'month').getTime();
    max = time.floor(maxDate, 'month').getTime();
    bins = [];

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
    // Note: see sourcemodel.js > generateEmptyBins_() for example of how to use MAGIC_MONTH_MILLIS and os.time.step()
    expect(stats.binCountAll).toBe(2);
  });
});

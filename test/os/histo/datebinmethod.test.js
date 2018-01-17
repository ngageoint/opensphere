goog.require('os.histo.DateBinMethod');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');


describe('os.histo.DateBinMethod', function() {
  var method = new os.histo.DateBinMethod();
  method.setField('field');
  method.setDateBinType(os.histo.DateBinType.UNIQUE);

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
      {field: new os.time.TimeInstant(d.getTime())},
      {field: new os.time.TimeRange(d.getTime(), d.getTime())},
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
      {field: d.toString()},
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
      {field: '30/01/2014 12:34:56 UTC'},
      {field: d.getTime()}
    ];

    for (var i = 0, n = unsupportedItems.length; i < n; i++) {
      expect(method.getValue(unsupportedItems[i])).toBe(os.histo.DateBinMethod.MAGIC);
    }
  });

  it('should bin uniquely', function() {
    method.setDateBinType(os.histo.DateBinType.UNIQUE);
    var items = [
      {field: '2014-01-30T12:34:56Z'},
      {field: '2014-01-30T12:34:30+0000'},
      {field: 'gibberish'},
      {field: ''},
      {field: null},
      {}];

    var values = items.map(method.getValue, method);
    var expected = [1391085296000, 1391085270000,
      os.histo.DateBinMethod.MAGIC, os.histo.DateBinMethod.MAGIC,
      os.histo.DateBinMethod.MAGIC, os.histo.DateBinMethod.MAGIC];

    var expectedLabels = ['2014-01-30 12:34:56Z', '2014-01-30 12:34:30Z',
      'Invalid Date', 'Invalid Date', 'Invalid Date', 'Invalid Date'];

    for (var i = 0, n = values.length; i < n; i++) {
      expect(method.getBinKey(values[i])).toBe(expected[i]);
      expect(method.getBinLabel(items[i])).toBe(expectedLabels[i]);
    }
  });

  it('should bin by hour', function() {
    method.setDateBinType(os.histo.DateBinType.HOUR);

    var items = [
      {field: '2014-01-30T12:34:56Z'},
      {field: '2014-01-30T13:35:30+0000'},
      {field: 'gibberish'}];

    var values = items.map(method.getValue, method);

    var expected = [1391083200000, 1391086800000, os.histo.DateBinMethod.MAGIC];
    var expectedLabels = ['2014-01-30 12', '2014-01-30 13', 'Invalid Date'];

    for (var i = 0, n = values.length; i < n; i++) {
      expect(method.getBinKey(values[i])).toBe(expected[i]);
      expect(method.getBinLabel(items[i])).toBe(expectedLabels[i]);
    }
  });

  it('should bin by hour of day', function() {
    method.setDateBinType(os.histo.DateBinType.HOUR_OF_DAY);

    var items = [
      {field: '2014-01-30T12:34:56Z'},
      {field: '2014-01-30T13:35:30+0000'},
      {field: 'gibberish'}];

    var values = items.map(method.getValue, method);
    var expected = [12, 13, os.histo.DateBinMethod.MAGIC];
    var expectedLabels = ['1200', '1300', 'Invalid Date'];

    for (var i = 0, n = values.length; i < n; i++) {
      expect(method.getBinKey(values[i])).toBe(expected[i]);
      expect(method.getBinLabel(items[i])).toBe(expectedLabels[i]);
    }
  });

  it('should bin by day', function() {
    method.setDateBinType(os.histo.DateBinType.DAY);

    var items = [
      {field: '2014-01-30T12:34:56Z'},
      {field: '2014-01-31T13:35:30+0000'},
      {field: 'gibberish'}];

    var values = items.map(method.getValue, method);
    var expected = [1391040000000, 1391126400000, os.histo.DateBinMethod.MAGIC];
    var expectedLabels = ['2014-01-30', '2014-01-31', 'Invalid Date'];

    for (var i = 0, n = values.length; i < n; i++) {
      expect(method.getBinKey(values[i])).toBe(expected[i]);
      expect(method.getBinLabel(items[i])).toBe(expectedLabels[i]);
    }
  });

  it('should bin by day of week', function() {
    method.setDateBinType(os.histo.DateBinType.DAY_OF_WEEK);

    var items = [
      {field: '2014-01-30T12:34:56Z'},
      // This date is on the 30th in Local, but on the 31st in UTC.
      {field: '2014-01-31T01:00:00Z'},
      {field: '2014-01-31T13:35:30+0000'},
      {field: 'gibberish'}];

    var values = items.map(method.getValue, method);
    var expected = [4, 5, 5, os.histo.DateBinMethod.MAGIC];
    var expectedLabels = ['Thursday', 'Friday', 'Friday', 'Invalid Date'];

    for (var i = 0, n = values.length; i < n; i++) {
      expect(method.getBinKey(values[i])).toBe(expected[i]);
      expect(method.getBinLabel(items[i])).toBe(expectedLabels[i]);
    }
  });

  it('should bin by week', function() {
    method.setDateBinType(os.histo.DateBinType.WEEK);

    var items = [
      {field: '2014-01-23T12:34:56Z'},
      {field: '2014-01-31T13:35:30+0000'},
      {field: 'gibberish'}];

    var values = items.map(method.getValue, method);
    var expected = [1390089600000, 1390694400000, os.histo.DateBinMethod.MAGIC];
    var expectedLabels = ['2014-01-19', '2014-01-26', 'Invalid Date'];

    for (var i = 0, n = values.length; i < n; i++) {
      expect(method.getBinKey(values[i])).toBe(expected[i]);
      expect(method.getBinLabel(items[i])).toBe(expectedLabels[i]);
    }
  });

  it('should bin by month', function() {
    method.setDateBinType(os.histo.DateBinType.MONTH);

    var items = [
      {field: '2014-01-23T12:34:56Z'},
      {field: '2014-02-19T12:35:30+0000'},
      {field: 'gibberish'}];

    var values = items.map(method.getValue, method);
    var expected = [1388534400000, 1391212800000, os.histo.DateBinMethod.MAGIC];
    var expectedLabels = ['2014-01', '2014-02', 'Invalid Date'];

    for (var i = 0, n = values.length; i < n; i++) {
      expect(method.getBinKey(values[i])).toBe(expected[i]);
      expect(method.getBinLabel(items[i])).toBe(expectedLabels[i]);
    }
  });

  it('should bin by year', function() {
    method.setDateBinType(os.histo.DateBinType.YEAR);

    var items = [
      {field: '2014-01-23T12:34:56Z'},
      {field: '2013-01-31T13:35:30+0000'},
      {field: 'gibberish'}];

    var values = items.map(method.getValue, method);
    var expected = [1388534400000, 1356998400000, os.histo.DateBinMethod.MAGIC];
    var expectedLabels = ['2014', '2013', 'Invalid Date'];

    for (var i = 0, n = values.length; i < n; i++) {
      expect(method.getBinKey(values[i])).toBe(expected[i]);
      expect(method.getBinLabel(items[i])).toBe(expectedLabels[i]);
    }
  });

  it('should restore correctly', function() {
    var method = new os.histo.DateBinMethod();
    method.setDateBinType(os.histo.DateBinType.UNIQUE);

    // if the bin type isn't set, don't change it
    method.restore({});
    expect(method.getDateBinType()).toBe(os.histo.DateBinType.UNIQUE);

    method.restore({
      binType: null
    });
    expect(method.getDateBinType()).toBe(os.histo.DateBinType.UNIQUE);

    // if the bin type isn't known, don't change it
    method.restore({
      binType: 'SomeUnknownType'
    });
    expect(method.getDateBinType()).toBe(os.histo.DateBinType.UNIQUE);

    // sets the bin type if the value is a known type
    method.restore({
      binType: os.histo.DateBinType.MINUTE
    });
    expect(method.getDateBinType()).toBe(os.histo.DateBinType.MINUTE);

    method.restore({
      binType: os.histo.DateBinType.HOUR
    });
    expect(method.getDateBinType()).toBe(os.histo.DateBinType.HOUR);
  });
});

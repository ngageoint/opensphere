goog.require('os.histo.Histogram');
goog.require('os.histo.UniqueBinMethod');

describe('os.histo.Histogram', function() {
  it('should bin items after the method is added', function() {
    var histogram = new os.histo.Histogram();
    var method = new os.histo.UniqueBinMethod();
    method.setField('field');
    histogram.setBinMethod(method);

    var items = [
      {id: 1, field: 'A'},
      {id: 2, field: 'A'},
      {id: 3, field: 'A'},
      {id: 4, field: 'B'},
      {id: 5, field: 'B'},
      {id: 6, field: 'C'},
      {id: 7}
    ];

    var expected = {
      'A': 3,
      'B': 2,
      'C': 1,
      'No field': 1
    };

    histogram.addItems(items);
    var bins = histogram.getResults();
    expect(bins.length).toBe(4);

    for (var i = 0, n = bins.length; i < n; i++) {
      var bin = bins[i];
      var key = bin.getKey();
      var label = bin.getLabel();

      expect(key).toBe(label);
      expect(bin.getCount()).toBe(expected[label]);
    }
  });

  it('should bin already-added items when the method is added', function() {
    var histogram = new os.histo.Histogram();
    var method = new os.histo.UniqueBinMethod();
    method.setField('field');

    var items = [
      {id: 1, field: 'A'},
      {id: 2, field: 'A'},
      {id: 3, field: 'A'},
      {id: 4, field: 'B'},
      {id: 5, field: 'B'},
      {id: 6, field: 'C'},
      {id: 7}
    ];

    var expected = {
      'A': 3,
      'B': 2,
      'C': 1,
      'No field': 1
    };

    histogram.addItems(items);
    histogram.setBinMethod(method);

    var results = histogram.getResults();
    expect(results.length).toBe(4);

    for (var i = 0, n = results.length; i < n; i++) {
      var result = results[i];
      expect(result.getCount()).toBe(expected[result.getLabel()]);
    }
  });

  it('should update as items are added', function() {
    var histogram = new os.histo.Histogram();
    var method = new os.histo.UniqueBinMethod();
    method.setField('field');
    histogram.setBinMethod(method);

    var items = [{id: 1, field: 'A'}];
    histogram.addItems(items);
    var results = histogram.getResults();

    expect(results.length).toBe(1);
    expect(results[0].getItems().length).toBe(1);

    histogram.addItems({id: 2, field: 'A'});
    results = histogram.getResults();

    expect(results.length).toBe(1);
    expect(results[0].getItems().length).toBe(2);

    histogram.addItems({id: 3, field: 'B'});
    results = histogram.getResults();

    expect(results.length).toBe(2);
  });

  it('should update as items are removed', function() {
    var histogram = new os.histo.Histogram();
    var method = new os.histo.UniqueBinMethod();
    method.setField('field');

    var items = [
      {id: 1, field: 'A'},
      {id: 2, field: 'A'},
      {id: 3, field: 'A'},
      {id: 4, field: 'B'},
      {id: 5, field: 'B'},
      {id: 6, field: 'C'},
      {id: 7}
    ];

    var expected = {
      'A': 2,
      'B': 2,
      'No field': 1
    };

    histogram.addItems(items);
    histogram.setBinMethod(method);

    var results = histogram.getResults();
    expect(results.length).toBe(4);

    histogram.removeItems([items[0], items[5]]);
    results = histogram.getResults();
    expect(results.length).toBe(3);

    for (var i = 0, n = results.length; i < n; i++) {
      var result = results[i];
      expect(result.getCount()).toBe(expected[result.getLabel()]);
    }
  });

  it('should clear items', function() {
    var histogram = new os.histo.Histogram();
    var method = new os.histo.UniqueBinMethod();
    method.setField('field');
    histogram.setBinMethod(method);

    var items = [
      {id: 1, field: 'A'},
      {id: 2, field: 'A'},
      {id: 3, field: 'A'},
      {id: 4, field: 'B'},
      {id: 5, field: 'B'},
      {id: 6, field: 'C'},
      {id: 7}
    ];

    histogram.addItems(items);
    histogram.clear();
    var results = histogram.getResults();

    expect(results.length).toBe(0);
  });
});

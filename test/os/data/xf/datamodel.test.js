goog.require('os.data.xf.DataModel');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');
goog.require('goog.object');


describe('os.data.xf.DataModel', function() {
  var data = [];
  for (var i = 0; i <= 99; i++) {
    var val = null;

    if (i % 2 == 1) {
      val = i + '';
    } else {
      val = i;
    }

    data.push({ id: i, value: val });
  }

  var numObjects = data.length;

  var dim1 = function(item) {
    return goog.isString(item.value);
  };

  var dim2 = function(item) {
    return goog.isNumber(item.value);
  };

  var filter = null;
  beforeEach(function() {
    if (filter) {
      filter.dispose();
    }

    filter = new os.data.xf.DataModel();
  });

  it('should initialize properly', function() {
    expect(filter.isEmpty()).toBe(true);
    expect(goog.object.getCount(filter.dimensions)).toBe(0);
  });

  it('should add dimensions properly', function() {
    filter.addDimension('string', dim1);
    filter.addDimension('number', dim2);
    expect(goog.object.getCount(filter.dimensions)).toBe(2);
  });

  it('should add objects with time instants to the filter', function() {
    filter.add(data);
    expect(filter.isEmpty()).toBe(false);
    expect(filter.getSize()).toBe(data.length);
  });

  it('should get results properly', function() {
    filter.addDimension('string', dim1);
    filter.addDimension('number', dim2);
    filter.add(data);

    filter.filterDimension('string', true);
    filter.filterDimension('number', false);

    var results = filter.getResults();
    expect(results.length).toBe(50);
    expect(goog.isString(results[0].value)).toBe(true);

    filter.filterDimension('string', false);
    filter.filterDimension('number', true);

    var results = filter.getResults(25);
    expect(results.length).toBe(25);
    expect(goog.isNumber(results[0].value)).toBe(true);
  });

  it('should filter objects after finding the intersection', function() {
    var filterFunction = function(item, index, array) {
      return index % 2 == 1;
    };

    filter.addDimension('string', dim1);
    filter.addDimension('number', dim2);
    filter.add(data);
    filter.setFilterFunction(filterFunction);
    filter.filterDimension('string', true);
    filter.filterDimension('number', false);

    results = filter.getResults();
    expect(results.length).toBe(numObjects / 4);
  });

  it('should clear properly', function() {
    expect(filter.isEmpty()).toBe(true);
    expect(filter.getSize()).toBe(0);

    filter.add(data);
    expect(filter.isEmpty()).toBe(false);
    expect(filter.getSize()).toBe(numObjects);

    filter.clear();
    expect(filter.isEmpty()).toBe(true);
    expect(filter.getSize()).toBe(0);
  });

  it('should dispose properly', function() {
    expect(filter.isEmpty()).toBe(true);
    expect(filter.getSize()).toBe(0);

    filter.add(data);
    expect(filter.isEmpty()).toBe(false);
    expect(filter.getSize()).toBe(numObjects);

    filter.dispose();
    expect(filter.isEmpty()).toBe(true);
    expect(filter.xf).toBeNull();
  });
});

goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');
goog.require('os.time.TimelineController');
goog.require('os.time.xf.TimeModel');
goog.require('goog.math.Range');


/**
 * Tests for os.time.xf.TimeModel.
 */
describe('os.time.xf.TimeModel', function() {
  var getTimeFn = function(item) {
    return item.time;
  };

  var filter = null;
  beforeEach(function() {
    if (filter) {
      filter.dispose();
    }

    filter = new os.time.xf.TimeModel(getTimeFn);
  });

  // populate some objects with time instants/ranges for testing
  var instantObjects = [];
  var rangeObjects = [];
  var now = new Date().getTime();
  for (var i = 0; i <= 1000; i += 10) {
    var start = now + i;
    var end = start + 100;
    instantObjects.push({id: 'instant_' + start, time: new os.time.TimeInstant(start)});
    rangeObjects.push({id: 'range_' + start, time: new os.time.TimeRange(start, end)});
  }

  // time ranges for the above sets of objects
  var instantRange = new os.time.TimeRange(now, now + 1000);
  var fullRange = new os.time.TimeRange(now, now + 1000 + 100);

  // total number of timed objects
  var numObjects = instantObjects.length + rangeObjects.length;

  var noStart = {
    id: 'noStart',
    time: new os.time.TimeRange(-Infinity, now)
  };

  var noEnd = {
    id: 'noEnd',
    time: new os.time.TimeRange(now, Infinity)
  };

  var boundless = {
    id: 'boundless',
    time: new os.time.TimeRange(-Infinity, Infinity)
  };

  var timeless = {
    id: 'timeless'
  };

  var stringTime = {
    id: 'stringTime',
    time: '2010-01-01T01:02:03.456Z'
  };

  var numberTime = {
    id: 'numberTime',
    time: 12345
  };

  var booleanTime = {
    id: 'booleanTime',
    time: true
  };

  var invalidTimes = [stringTime, numberTime, booleanTime];

  var unboundedObjects = [noStart, noEnd, boundless];

  it('should initialize properly', function() {
    expect(filter.getTimeFn).toBe(getTimeFn);
    expect(filter.isEmpty()).toBe(true);
  });

  it('should add objects with time instants to the filter', function() {
    filter.add(instantObjects);
    expect(filter.isEmpty()).toBe(false);
    expect(filter.xf.size()).toBe(instantObjects.length);
  });

  it('should add objects with time ranges to the filter', function() {
    filter.add(rangeObjects);
    expect(filter.isEmpty()).toBe(false);
    expect(filter.xf.size()).toBe(rangeObjects.length);
  });

  it('should be able to add a combination of objects to the filter', function() {
    filter.add(instantObjects);
    filter.add(rangeObjects);
    expect(filter.isEmpty()).toBe(false);
    expect(filter.xf.size()).toBe(numObjects);
  });

  it('should calculate intersections properly', function() {
    filter.add(instantObjects);
    filter.add(rangeObjects);

    // first instant/range
    var results = filter.intersection(new os.time.TimeRange(now, now));
    expect(results.length).toBe(2);

    // nothing
    results = filter.intersection(new os.time.TimeRange(now - 1, now - 1));
    expect(results.length).toBe(0);

    // first range
    results = filter.intersection(new os.time.TimeRange(now + 1, now + 1));
    expect(results.length).toBe(1);

    // first instant/range
    results = filter.intersection(new os.time.TimeRange(now - 1, now + 1));
    expect(results.length).toBe(2);

    // all but the last instant/range
    results = filter.intersection(new os.time.TimeRange(now, now + 999));
    expect(results.length).toBe(numObjects - 2);

    // everything
    results = filter.intersection(new os.time.TimeRange(now, now + 1001));
    expect(results.length).toBe(numObjects);

    // drop 10 of the instants, still all of the ranges
    results = filter.intersection(new os.time.TimeRange(now + 100, now + 1001));
    expect(results.length).toBe(numObjects - 10);

    // drop the first range and another instant
    results = filter.intersection(new os.time.TimeRange(now + 101, now + 1001));
    expect(results.length).toBe(numObjects - 12);

    // everything
    results = filter.intersection(new os.time.TimeRange(now, Infinity));
    expect(results.length).toBe(numObjects);

    // everything
    results = filter.intersection(new os.time.TimeRange(-Infinity, Infinity));
    expect(results.length).toBe(numObjects);

    // won't match end of range
    results = filter.intersection(new os.time.TimeRange(-Infinity, now));
    expect(results.length).toBe(0);

    // first instant/range
    results = filter.intersection(new os.time.TimeRange(-Infinity, now + 1));
    expect(results.length).toBe(2);
  });

  it('should add objects that do not have a time', function() {
    expect(filter.isEmpty()).toBe(true);

    filter.add(timeless);
    expect(filter.isEmpty()).toBe(false);
    expect(filter.xf.size()).toBe(0);
    expect(filter.timelessXf.size()).toBe(1);

    filter.add(instantObjects);
    filter.add(rangeObjects);
    expect(filter.isEmpty()).toBe(false);
    expect(filter.xf.size()).toBe(numObjects);
  });

  it('should handle objects with unbounded time', function() {
    filter.add(instantObjects);
    filter.add(rangeObjects);
    filter.add(unboundedObjects);
    expect(filter.xf.size()).toBe(numObjects + unboundedObjects.length);

    // first instant/range + all unboundedObjects
    var results = filter.intersection(new os.time.TimeRange(now, now));
    expect(results.length).toBe(unboundedObjects.length + 2);

    // noStart + unboundedObjects
    results = filter.intersection(new os.time.TimeRange(-Infinity, now - 1));
    expect(results.length).toBe(2);

    // everything
    results = filter.intersection(new os.time.TimeRange(-Infinity, Infinity));
    expect(results.length).toBe(numObjects + unboundedObjects.length);
  });

  it('should handle objects with invalid time types', function() {
    expect(filter.isEmpty()).toBe(true);

    filter.add(invalidTimes);
    expect(filter.isEmpty()).toBe(false);
    expect(filter.xf.size()).toBe(0);
    expect(filter.timelessXf.size()).toBe(invalidTimes.length);
  });

  it('should filter objects after finding the intersection', function() {
    var filterFunction = function(item, index, array) {
      return index % 2 == 1;
    };

    filter.add(instantObjects);
    filter.add(rangeObjects);
    filter.setFilterFunction(filterFunction);

    results = filter.intersection(new os.time.TimeRange(-Infinity, Infinity));
    expect(results.length).toBe(numObjects / 2);
  });

  it('should update the time range of loaded data', function() {
    var range = filter.getRange();
    expect(range.getStart()).toBe(0);
    expect(range.getEnd()).toBe(0);

    filter.add(instantObjects);

    // range includes all instant data
    range = filter.getRange();
    expect(range.getStart()).toBe(instantRange.getStart());
    expect(range.getEnd()).toBe(instantRange.getEnd());

    filter.add(timeless);

    // range doesn't change
    range = filter.getRange();
    expect(range.getStart()).toBe(instantRange.getStart());
    expect(range.getEnd()).toBe(instantRange.getEnd());

    filter.add(rangeObjects);

    // range includes all data
    range = filter.getRange();
    expect(range.getStart()).toBe(fullRange.getStart());
    expect(range.getEnd()).toBe(fullRange.getEnd());
  });

  it('should reset the intersection when updating the time range', function() {
    spyOn(filter, 'intersection').andCallThrough();

    // intersection wasn't called yet, so the last range will be null
    expect(filter.intersection.calls.length).toBe(0);
    filter.add(instantObjects);
    expect(filter.intersection.calls.length).toBe(0);

    var infiniteRange = new os.time.TimeRange(-Infinity, Infinity);
    filter.intersection(infiniteRange);
    expect(filter.intersection.calls.length).toBe(1);
    expect(filter.lastRange).toBe(infiniteRange);

    filter.add(rangeObjects);
    expect(filter.intersection.calls.length).toBe(2);
    expect(filter.intersection.calls[1].args[0]).toBe(infiniteRange);
  });

  it('should clear properly', function() {
    expect(filter.isEmpty()).toBe(true);
    expect(filter.xf.size()).toBe(0);

    filter.add(instantObjects);
    filter.add(rangeObjects);
    filter.add(timeless);

    // data should be loaded
    expect(filter.isEmpty()).toBe(false);
    expect(filter.xf.size()).toBe(numObjects);
    expect(filter.timelessXf.size()).toBe(1);

    // range should be set prior to clear
    var range = filter.getRange();
    expect(range.getStart()).toBe(fullRange.getStart());
    expect(range.getEnd()).toBe(fullRange.getEnd());

    filter.clear();

    // all data should be gone
    expect(filter.isEmpty()).toBe(true);
    expect(filter.xf.size()).toBe(0);
    expect(filter.timelessXf.size()).toBe(0);

    // range should be cleared
    range = filter.getRange();
    expect(range.getStart()).toBe(0);
    expect(range.getEnd()).toBe(0);
  });

  it('should dispose properly', function() {
    expect(filter.isEmpty()).toBe(true);
    expect(filter.xf.size()).toBe(0);

    filter.add(instantObjects);
    filter.add(rangeObjects);
    filter.add(timeless);
    expect(filter.isEmpty()).toBe(false);
    expect(filter.xf.size()).toBe(numObjects);
    expect(filter.timelessXf.size()).toBe(1);

    filter.dispose();
    expect(filter.isEmpty()).toBe(true);
    expect(filter.xf).toBeNull();
    expect(filter.timelessXf).toBeNull();
  });

  it('should dispose dimensions properly', function() {
    var testXf = new os.time.xf.TimeModel(goog.functions.TRUE);
    spyOn(testXf.timelessXf, 'dimension').andCallThrough();

    expect(testXf.defaultDimension).not.toBeNull();

    // this would previously fail on the 32nd call because there are too many dimensions on the XF instance
    for (var i = 0; i < 100; i++) {
      testXf.removeDimension('doesntmatter');
    }

    // default dimension already existed and no new dimensions were added, so this shouldn't have been called
    expect(testXf.timelessXf.dimension).not.toHaveBeenCalled();

    var dd = testXf.defaultDimension;
    spyOn(dd, 'dispose').andCallThrough();

    var dimId = 'testDim';
    testXf.addDimension(dimId, goog.functions.TRUE);

    // default dimension should be disposed
    expect(dd.dispose).toHaveBeenCalled();
    expect(testXf.defaultDimension).toBeNull();

    // dimension was added
    expect(testXf.timelessXf.dimension.callCount).toEqual(1);

    // grab references to the new dimensions
    var testDim1 = testXf.dimensions[dimId];
    var testDim2 = testXf.timelessDimensions[dimId];
    expect(testDim1).toBeDefined();
    expect(testDim2).toBeDefined();

    // set up disposal spies
    spyOn(testDim1, 'dispose').andCallThrough();
    spyOn(testDim2, 'dispose').andCallThrough();

    // shouldn't do anything
    testXf.removeDimension('doesntexist');

    // no new dimension created
    expect(testXf.timelessXf.dimension.callCount).toEqual(1);
    expect(testXf.defaultDimension).toBeNull();

    // should remove the new dimension and add the default dimension
    testXf.removeDimension(dimId);
    expect(testXf.timelessXf.dimension.callCount).toEqual(2);
    expect(testXf.defaultDimension).not.toBeNull();
    expect(testDim1.dispose).toHaveBeenCalled();
    expect(testDim2.dispose).toHaveBeenCalled();
  });

  it('should calculate timeless intersections properly', function() {
    var includeTimeless = true;
    filter.add(instantObjects);
    filter.add(rangeObjects);
    filter.add(timeless);

    // first instant/range
    var results = filter.intersection(new os.time.TimeRange(now, now));
    expect(results.length).toBe(2);
    results = filter.intersection(new os.time.TimeRange(now, now), includeTimeless);
    expect(results.length).toBe(3);
  });

  it('should calculate hold intersections properly', function() {
    filter.dispose();

    var includeTimeless = false;
    var includeHolds = true;
    var holdCount = 0;
    var tlc = os.time.TimelineController.getInstance();

    /**
     * For holds to work correctly, the main time model get time function should return null for items that are held,
     * e.g. held items should be treated as timeless.
     * @param {Object} item The item
     * @return {?os.time.ITime}
     */
    var getTimeWithHoldSupportFn = function(item) {
      if (tlc.holdRangeContainsTime(item.time)) {
        return null;
      }
      return item.time;
    };

    /**
     * Inverse of the main getTime function in that it only returns times for items in a held range.
     * @param {Object} item The item
     * @return {?os.time.ITime}
     */
    var getHoldTimeFn = function(item) {
      if (tlc.holdRangeContainsTime(item.time)) {
        // crossfilter seems to call this twice. Flagging
        // to get accruate count for unit-test.
        if (!item.isHold) {
          holdCount++;
        }
        item.isHold = true;
        return item.time;
      }
      return null;
    };

    // Holds need to be defined in the timeline controller for the holds process
    // to work correctly.
    var holdRange = new goog.math.Range(now, now + 20);
    var tlc = os.time.TimelineController.getInstance();
    tlc.clearHoldRanges();
    tlc.addHoldRange(holdRange);

    // Creating TimeModel with two gettime functions that handle holds correctly.
    var timeModelWithHold = new os.time.xf.TimeModel(getTimeWithHoldSupportFn, getHoldTimeFn);
    timeModelWithHold.add(instantObjects);

    // using the same interseciton range for each test step that
    // encompasses the hold range and a bit more.
    var intersectionTimeRange = new os.time.TimeRange(now, now + 40);

    // Get all times in the intersection range without holds.
    var results = timeModelWithHold.intersection(intersectionTimeRange);
    var itemsInRangeWithoutHolds = results.length;
    // we should not get any data in the hold range back.
    for (var i = 0; i < results.length; i = i + 1) {
      var timeitem = results[i].time;
      expect(tlc.holdRangeContainsTime(timeitem)).toBe(false);
    }

    // include holds, which should include the holds and normal items in the intersection range.
    results = timeModelWithHold.intersection(intersectionTimeRange, includeTimeless, includeHolds);

    var itemsInCombinedRanges = results.length;
    // Expecting the items in the combined range to include all the non hold items in the range
    // plus all items in the hold.
    expect(itemsInCombinedRanges).toBe(holdCount + itemsInRangeWithoutHolds);

    tlc.clearHoldRanges();
    timeModelWithHold.dispose();
  });
});

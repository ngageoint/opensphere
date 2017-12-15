goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');


describe('os.time.TimeRange', function() {
  var h = 12 * 60 * 60 * 1000;

  it('should implement ITime', function() {
    expect(os.implements(new os.time.TimeRange(h, 2 * h), os.time.ITime.ID)).toBe(true);
  });

  it('should be instantiated properly', function() {
    var t = new os.time.TimeInstant(h);
    expect(t.getStart()).toBe(h);

    var r = new os.time.TimeRange(h, 2 * h);
    expect(r.getStart()).toBe(h);
    expect(r.getEnd()).toBe(2 * h);
  });

  it('should print the correct time', function() {
    var r = new os.time.TimeRange(0, h);

    expect(r.toISOString()).toBe('1970-01-01 00:00:00Z to 1970-01-01 12:00:00Z');
    r.setStart(os.time.TimeInstant.MIN_TIME);
    expect(r.toString()).toBe('Unbounded to 1970-01-01 12:00:00Z');
    r.setEnd(os.time.TimeInstant.MAX_TIME);
    expect(r.toString()).toBe('Unbounded to Unbounded');
    r.setStart(0);
    expect(r.toString()).toBe('1970-01-01 00:00:00Z to Unbounded');
  });

  it('should check equality against time instants', function() {
    var r = new os.time.TimeRange(h, 2 * h);
    var t = new os.time.TimeInstant(2 * h);

    expect(r.equals(t)).toBe(false);

    r.setStart(2 * h);
    expect(r.equals(t)).toBe(true);
  });

  it('should check equality against other time ranges', function() {
    var r = new os.time.TimeRange(0, 2 * h);
    var o = new os.time.TimeRange(h, 2 * h);

    expect(r.equals(o)).toBe(false);

    o.setStart(0);
    expect(r.equals(o)).toBe(true);
  });

  it('should compare properly to other time ranges', function() {
    var r = new os.time.TimeRange(0, 2 * h);
    var o = new os.time.TimeRange(h, 2 * h);

    // contained range
    expect(r.compare(o)).toBe(0);

    // same range
    o.setStart(0);
    expect(r.compare(o)).toBe(0);

    // intersected range from start
    o.setStart(os.time.TimeInstant.MIN_TIME);
    o.setEnd(h);
    expect(r.compare(o)).toBe(0);

    // intersected range from end
    o.setStart(h);
    o.setEnd(os.time.TimeInstant.MAX_TIME);
    expect(r.compare(o)).toBe(0);

    // other end same as start
    o.setStart(os.time.TimeInstant.MIN_TIME);
    o.setEnd(0);
    expect(r.compare(o)).toBe(1);
    expect(o.compare(r)).toBe(-1);

    // end same as other start
    o.setStart(2 * h);
    o.setEnd(os.time.TimeInstant.MAX_TIME);
    expect(r.compare(o)).toBe(-1);
    expect(o.compare(r)).toBe(1);
  });

  it('should ensure timerange getStart() is before getEnd()', function() {
    var r = new os.time.TimeRange(os.time.TimeInstant.MIN_TIME, os.time.TimeInstant.MAX_TIME);

    expect(r.getStart()).toBe(os.time.TimeInstant.MIN_TIME);
    expect(r.getEnd()).toBe(os.time.TimeInstant.MAX_TIME);

    r.setStart(os.time.TimeInstant.MAX_TIME);
    r.setEnd(os.time.TimeInstant.MIN_TIME);

    //TimeRage.getStart() should alaways return the min of the timerange
    expect(r.getStart()).toBe(os.time.TimeInstant.MIN_TIME);
    //TimeRage.getEnd() should alaways return the max of the timerange
    expect(r.getEnd()).toBe(os.time.TimeInstant.MAX_TIME);
  });

  it('should compare properly to other time instants', function() {
    var r = new os.time.TimeRange(0, 2 * h);
    var t = new os.time.TimeInstant(h);

    // contained
    expect(r.compare(t)).toBe(0);

    // at start
    t.setStart(0);
    expect(r.compare(t)).toBe(0);

    // at end
    t.setStart(2 * h);
    expect(r.compare(t)).toBe(-1);
    expect(t.compare(r)).toBe(1);

    // less than start
    t.setStart(-1);
    expect(r.compare(t)).toBe(1);
    expect(t.compare(r)).toBe(-1);

    // greater than end
    t.setStart(3 * h);
    expect(r.compare(t)).toBe(-1);
    expect(t.compare(r)).toBe(1);
  });
});

goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');
goog.require('goog.date.Date');
goog.require('goog.date.DateTime');
goog.require('goog.date.UtcDateTime');


describe('os.time.TimeInstant', function() {
  var h = 12 * 60 * 60 * 1000;

  it('should implement ITime', function() {
    expect(os.implements(new os.time.TimeInstant(), os.time.ITime.ID)).toBe(true);
  });

  it('should support number values', function() {
    var t = new os.time.TimeInstant(h);
    expect(t.getStart()).toBe(h);
    expect(t.getEnd()).toBe(h);
  });

  it('should support date values', function() {
    var t = new os.time.TimeInstant(new Date(h));
    expect(t.getStart()).toBe(h);
    expect(t.getEnd()).toBe(h);
  });

  it('should support goog.date.Date values', function() {
    var d = new goog.date.Date();
    d.setTime(h);

    var t = new os.time.TimeInstant(d);
    expect(t.getStart()).toBe(h);
    expect(t.getEnd()).toBe(h);
  });

  it('should support goog.date.DateTime values', function() {
    var d = new goog.date.DateTime();
    d.setTime(h);

    var t = new os.time.TimeInstant(d);
    expect(t.getStart()).toBe(h);
    expect(t.getEnd()).toBe(h);
  });

  it('should support goog.date.UtcDateTime values', function() {
    var d = new goog.date.UtcDateTime();
    d.setTime(h);

    var t = new os.time.TimeInstant(d);
    expect(t.getStart()).toBe(h);
    expect(t.getEnd()).toBe(h);
  });

  it('should print the correct time', function() {
    var t = new os.time.TimeInstant(h);
    expect(t.toISOString()).toBe('1970-01-01 12:00:00Z');
  });

  it('should check equality against other time instants', function() {
    var t = new os.time.TimeInstant(h);
    var o = new os.time.TimeInstant(0);

    expect(t.equals(o)).toBe(false);

    o.setStart(h);
    expect(t.equals(o)).toBe(true);
  });

  it('should compare properly to other time instants', function() {
    var t = new os.time.TimeInstant(h);
    var o = new os.time.TimeInstant(0);

    expect(o.compare(t)).toBe(-1);
    expect(t.compare(o)).toBe(1);
  });

  it('should intersect properly with other time instants', function() {
    var t = new os.time.TimeInstant(h);
    expect(t.intersects(t)).toBe(true);
  });

  it('should compare properly to other time ranges', function() {
    var t = new os.time.TimeInstant(h);
    var o = new os.time.TimeRange(0, 2 * h);

    expect(t.compare(o)).toBe(0);
    t = new os.time.TimeInstant(0);
    expect(t.compare(o)).toBe(0);
    t = new os.time.TimeInstant(2 * h);
    expect(t.compare(o)).toBe(1);
    t = new os.time.TimeInstant(-1);
    expect(t.compare(o)).toBe(-1);
  });

  it('should parse time-like values', function() {
    var now = Date.now();
    var nowDate = new Date(now);

    // test standard values
    expect(os.time.TimeInstant.parseTime(now)).toBe(now);
    expect(os.time.TimeInstant.parseTime(nowDate)).toBe(now);
    expect(os.time.TimeInstant.parseTime(nowDate.toISOString())).toBe(now);
    expect(os.time.TimeInstant.parseTime(new os.time.TimeInstant(now))).toBe(now);
    expect(os.time.TimeInstant.parseTime(new os.time.TimeRange(now, now + 5000))).toBe(now);

    // test range
    expect(os.time.TimeInstant.parseTime(os.time.TimeInstant.MIN_TIME - 5000)).toBe(os.time.TimeInstant.MIN_TIME);
    expect(os.time.TimeInstant.parseTime(os.time.TimeInstant.MAX_TIME + 5000)).toBe(os.time.TimeInstant.MAX_TIME);

    // test invalid values
    expect(os.time.TimeInstant.parseTime(undefined)).toBe(0);
    expect(os.time.TimeInstant.parseTime(null)).toBe(0);
    expect(os.time.TimeInstant.parseTime(NaN)).toBe(0);

    expect(os.time.TimeInstant.parseTime('not-a-date')).toBe(0);
    expect(os.time.TimeInstant.parseTime({
      'not': 'a-time-object'
    })).toBe(0);
  });
});

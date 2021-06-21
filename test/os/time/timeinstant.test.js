goog.require('goog.date.Date');
goog.require('goog.date.DateTime');
goog.require('goog.date.UtcDateTime');
goog.require('os.implements');
goog.require('os.time.ITime');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');


describe('os.time.TimeInstant', function() {
  const GoogDate = goog.module.get('goog.date.Date');
  const DateTime = goog.module.get('goog.date.DateTime');
  const UtcDateTime = goog.module.get('goog.date.UtcDateTime');
  const osImplements = goog.module.get('os.implements');
  const ITime = goog.module.get('os.time.ITime');
  const TimeInstant = goog.module.get('os.time.TimeInstant');
  const TimeRange = goog.module.get('os.time.TimeRange');

  var h = 12 * 60 * 60 * 1000;

  it('should implement ITime', function() {
    expect(osImplements(new TimeInstant(), ITime.ID)).toBe(true);
  });

  it('should support number values', function() {
    var t = new TimeInstant(h);
    expect(t.getStart()).toBe(h);
    expect(t.getEnd()).toBe(h);
  });

  it('should support date values', function() {
    var t = new TimeInstant(new Date(h));
    expect(t.getStart()).toBe(h);
    expect(t.getEnd()).toBe(h);
  });

  it('should support goog.date.Date values', function() {
    var d = new GoogDate();
    d.setTime(h);

    var t = new TimeInstant(d);
    expect(t.getStart()).toBe(h);
    expect(t.getEnd()).toBe(h);
  });

  it('should support goog.date.DateTime values', function() {
    var d = new DateTime();
    d.setTime(h);

    var t = new TimeInstant(d);
    expect(t.getStart()).toBe(h);
    expect(t.getEnd()).toBe(h);
  });

  it('should support goog.date.UtcDateTime values', function() {
    var d = new UtcDateTime();
    d.setTime(h);

    var t = new TimeInstant(d);
    expect(t.getStart()).toBe(h);
    expect(t.getEnd()).toBe(h);
  });

  it('should print the correct time', function() {
    var t = new TimeInstant(h);
    expect(t.toISOString()).toBe('1970-01-01T12:00:00Z');
  });

  it('should check equality against other time instants', function() {
    var t = new TimeInstant(h);
    var o = new TimeInstant(0);

    expect(t.equals(o)).toBe(false);

    o.setStart(h);
    expect(t.equals(o)).toBe(true);
  });

  it('should compare properly to other time instants', function() {
    var t = new TimeInstant(h);
    var o = new TimeInstant(0);

    expect(o.compare(t)).toBe(-1);
    expect(t.compare(o)).toBe(1);
  });

  it('should intersect properly with other time instants', function() {
    var t = new TimeInstant(h);
    expect(t.intersects(t)).toBe(true);
  });

  it('should compare properly to other time ranges', function() {
    var t = new TimeInstant(h);
    var o = new TimeRange(0, 2 * h);

    expect(t.compare(o)).toBe(1);
    t = new TimeInstant(0);
    expect(t.compare(o)).toBe(0);
    t = new TimeInstant(2 * h);
    expect(t.compare(o)).toBe(1);
    t = new TimeInstant(-1);
    expect(t.compare(o)).toBe(-1);
  });

  it('should parse time-like values', function() {
    var now = Date.now();
    var nowDate = new Date(now);

    // test standard values
    expect(TimeInstant.parseTime(now)).toBe(now);
    expect(TimeInstant.parseTime(nowDate)).toBe(now);
    expect(TimeInstant.parseTime(nowDate.toISOString())).toBe(now);
    expect(TimeInstant.parseTime(new TimeInstant(now))).toBe(now);
    expect(TimeInstant.parseTime(new TimeRange(now, now + 5000))).toBe(now);

    // test range
    expect(TimeInstant.parseTime(TimeInstant.MIN_TIME - 5000)).toBe(TimeInstant.MIN_TIME);
    expect(TimeInstant.parseTime(TimeInstant.MAX_TIME + 5000)).toBe(TimeInstant.MAX_TIME);

    // test invalid values
    expect(TimeInstant.parseTime(undefined)).toBe(0);
    expect(TimeInstant.parseTime(null)).toBe(0);
    expect(TimeInstant.parseTime(NaN)).toBe(0);

    expect(TimeInstant.parseTime('not-a-date')).toBe(0);
    expect(TimeInstant.parseTime({
      'not': 'a-time-object'
    })).toBe(0);
  });
});

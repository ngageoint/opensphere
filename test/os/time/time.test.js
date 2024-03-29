goog.require('os.config.Settings');
goog.require('os.time');
goog.require('os.time.Duration');

/**
 * Tests for os.time utility functions.
 */
describe('os.time', function() {
  const {default: Settings} = goog.module.get('os.config.Settings');
  const time = goog.module.get('os.time');
  const {default: Duration} = goog.module.get('os.time.Duration');

  it('should format dates properly', function() {
    var date = new Date('2010-01-20T01:02:03Z');

    expect(time.format(date)).toBe('2010-01-20 01:02:03');
    expect(time.format(date, '', false, true)).toBe('2010-01-20T01:02:03Z');
    expect(time.format(date, '', true)).toBe('2010-01-20');

    expect(time.format(date, 'day')).toBe('2010-01-20');
    expect(time.format(date, 'week')).toBe('2010-01-20');
    expect(time.format(date, 'month')).toBe('2010-01');
    expect(time.format(date, 'year')).toBe('2010');
  });

  it('should ceiling dates properly', function() {
    expect(time.ceil(new Date('2010-01-20T00:00:00Z'), 'sec').getTime()).toBe(new Date('2010-01-20T00:00:00Z')
        .getTime());
    expect(time.ceil(new Date('2010-01-20T00:00:00.100Z'), 'sec').getTime()).toBe(new Date('2010-01-20T00:00:01Z')
        .getTime());

    expect(time.ceil(new Date('2010-01-20T00:00:00Z'), 'min').getTime()).toBe(new Date('2010-01-20T00:00:00Z')
        .getTime());
    expect(time.ceil(new Date('2010-01-20T00:00:01Z'), 'min').getTime()).toBe(new Date('2010-01-20T00:01:00Z')
        .getTime());

    expect(time.ceil(new Date('2010-01-20T00:00:00Z'), 'hour').getTime()).toBe(new Date('2010-01-20T00:00:00Z')
        .getTime());
    expect(time.ceil(new Date('2010-01-20T00:00:01Z'), 'hour').getTime()).toBe(new Date('2010-01-20T01:00:00Z')
        .getTime());

    expect(time.ceil(new Date('2010-01-20T00:00:00Z'), 'day').getTime()).toBe(new Date('2010-01-20T00:00:00Z')
        .getTime());
    expect(time.ceil(new Date('2010-01-20T00:00:01Z'), 'day').getTime()).toBe(new Date('2010-01-21T00:00:00Z')
        .getTime());

    expect(time.ceil(new Date('2013-03-03T00:00:00Z'), 'week').getTime()).toBe(new Date('2013-03-03T00:00:00Z')
        .getTime());
    expect(time.ceil(new Date('2013-03-03T00:00:01Z'), 'week').getTime()).toBe(new Date('2013-03-10T00:00:00Z')
        .getTime());

    expect(time.ceil(new Date('2010-03-01T00:00:00Z'), 'month').getTime()).toBe(new Date('2010-03-01T00:00:00Z')
        .getTime());
    expect(time.ceil(new Date('2010-03-01T00:00:01Z'), 'month').getTime()).toBe(new Date('2010-04-01T00:00:00Z')
        .getTime());

    expect(time.ceil(new Date('2010-01-01T00:00:00Z'), 'year').getTime()).toBe(new Date('2010-01-01T00:00:00Z')
        .getTime());
    expect(time.ceil(new Date('2010-01-20T00:00:01Z'), 'year').getTime()).toBe(new Date('2011-01-01T00:00:00Z')
        .getTime());
  });

  it('should floor dates properly', function() {
    expect(time.floor(new Date('2013-01-15T00:00:00Z'), 'sec').getTime()).toBe(new Date('2013-01-15T00:00:00Z')
        .getTime());
    expect(time.floor(new Date('2013-01-15T00:00:00.999Z'), 'sec').getTime()).toBe(new Date('2013-01-15T00:00:00Z')
        .getTime());

    expect(time.floor(new Date('2013-01-15T00:00:00Z'), 'min').getTime()).toBe(new Date('2013-01-15T00:00:00Z')
        .getTime());
    expect(time.floor(new Date('2013-01-15T00:00:59Z'), 'min').getTime()).toBe(new Date('2013-01-15T00:00:00Z')
        .getTime());

    expect(time.floor(new Date('2013-01-15T00:00:00Z'), 'hour').getTime()).toBe(new Date('2013-01-15T00:00:00Z')
        .getTime());
    expect(time.floor(new Date('2013-01-15T00:59:59Z'), 'hour').getTime()).toBe(new Date('2013-01-15T00:00:00Z')
        .getTime());

    expect(time.floor(new Date('2013-01-15T00:00:00Z'), 'day').getTime()).toBe(new Date('2013-01-15T00:00:00Z')
        .getTime());
    expect(time.floor(new Date('2013-01-15T23:59:59Z'), 'day').getTime()).toBe(new Date('2013-01-15T00:00:00Z')
        .getTime());

    expect(time.floor(new Date('2013-03-03T00:00:00Z'), 'week').getTime()).toBe(new Date('2013-03-03T00:00:00Z')
        .getTime());
    expect(time.floor(new Date('2013-03-09T23:59:59Z'), 'week').getTime()).toBe(new Date('2013-03-03T00:00:00Z')
        .getTime());

    expect(time.floor(new Date('2013-03-01T00:00:00Z'), 'month').getTime()).toBe(new Date('2013-03-01T00:00:00Z')
        .getTime());
    expect(time.floor(new Date('2013-03-31T23:59:59Z'), 'month').getTime()).toBe(new Date('2013-03-01T00:00:00Z')
        .getTime());

    expect(time.floor(new Date('2013-01-01T00:00:00Z'), 'year').getTime()).toBe(new Date('2013-01-01T00:00:00Z')
        .getTime());
    expect(time.floor(new Date('2013-12-31T23:59:59Z'), 'year').getTime()).toBe(new Date('2013-01-01T00:00:00Z')
        .getTime());
  });

  it('should offset dates properly', function() {
    expect(time.offset(new Date('2013-01-15T00:00:00Z'), 'day', 1).getTime()).toBe(new Date('2013-01-16T00:00:00Z')
        .getTime());
    expect(time.offset(new Date('2013-01-15T00:00:00Z'), 'day', -1).getTime()).toBe(new Date('2013-01-14T00:00:00Z')
        .getTime());
    expect(time.offset(new Date('2013-01-15T00:00:00Z'), 'day', 2).getTime()).toBe(new Date('2013-01-17T00:00:00Z')
        .getTime());
    expect(time.offset(new Date('2013-01-15T00:00:00Z'), 'day', -2).getTime()).toBe(new Date('2013-01-13T00:00:00Z')
        .getTime());

    expect(time.offset(new Date('2013-03-15T00:00:00Z'), 'week', 1).getTime()).toBe(new Date('2013-03-22T00:00:00Z')
        .getTime());
    expect(time.offset(new Date('2013-03-15T00:00:00Z'), 'week', -1).getTime()).toBe(new Date('2013-03-08T00:00:00Z')
        .getTime());
    expect(time.offset(new Date('2013-03-15T00:00:00Z'), 'week', 2).getTime()).toBe(new Date('2013-03-29T00:00:00Z')
        .getTime());
    expect(time.offset(new Date('2013-03-15T00:00:00Z'), 'week', -2).getTime()).toBe(new Date('2013-03-01T00:00:00Z')
        .getTime());

    expect(time.offset(new Date('2013-03-01T00:00:00Z'), 'month', 1).getTime()).toBe(new Date('2013-04-01T00:00:00Z')
        .getTime());
    expect(time.offset(new Date('2013-03-01T00:00:00Z'), 'month', -1).getTime())
        .toBe(new Date('2013-02-01T00:00:00Z').getTime());
    expect(time.offset(new Date('2013-03-01T00:00:00Z'), 'month', 2).getTime()).toBe(new Date('2013-05-01T00:00:00Z')
        .getTime());
    expect(time.offset(new Date('2013-03-01T00:00:00Z'), 'month', -2).getTime())
        .toBe(new Date('2013-01-01T00:00:00Z').getTime());

    expect(time.offset(new Date('2013-01-01T00:00:00Z'), 'year', 1).getTime()).toBe(new Date('2014-01-01T00:00:00Z')
        .getTime());
    expect(time.offset(new Date('2013-01-01T00:00:00Z'), 'year', -1).getTime()).toBe(new Date('2012-01-01T00:00:00Z')
        .getTime());
    expect(time.offset(new Date('2013-01-01T00:00:00Z'), 'year', 2).getTime()).toBe(new Date('2015-01-01T00:00:00Z')
        .getTime());
    expect(time.offset(new Date('2013-01-01T00:00:00Z'), 'year', -2).getTime()).toBe(new Date('2011-01-01T00:00:00Z')
        .getTime());

    // do a couple around typical DST changes

    // fall back
    expect(time.offset(new Date('2015-10-31T00:00:00Z'), 'day', 1).getTime()).toBe(new Date('2015-11-01T00:00:00Z')
        .getTime());
    expect(time.offset(new Date('2015-11-01T00:00:00Z'), 'day', -1).getTime()).toBe(new Date('2015-10-31T00:00:00Z')
        .getTime());
    expect(time.offset(new Date('2015-10-31T00:00:00Z'), 'day', 2).getTime()).toBe(new Date('2015-11-02T00:00:00Z')
        .getTime());
    expect(time.offset(new Date('2015-11-02T00:00:00Z'), 'day', -2).getTime()).toBe(new Date('2015-10-31T00:00:00Z')
        .getTime());

    expect(time.offset(new Date('2015-10-25T00:00:00Z'), 'week', 1).getTime()).toBe(new Date('2015-11-01T00:00:00Z')
        .getTime());
    expect(time.offset(new Date('2015-11-01T00:00:00Z'), 'week', -1).getTime()).toBe(new Date('2015-10-25T00:00:00Z')
        .getTime());
    expect(time.offset(new Date('2015-10-25T00:00:00Z'), 'week', 2).getTime()).toBe(new Date('2015-11-08T00:00:00Z')
        .getTime());
    expect(time.offset(new Date('2015-11-08T00:00:00Z'), 'week', -2).getTime()).toBe(new Date('2015-10-25T00:00:00Z')
        .getTime());

    expect(time.offset(new Date('2015-10-01T00:00:00Z'), 'month', 1).getTime()).toBe(new Date('2015-11-01T00:00:00Z')
        .getTime());
    expect(time.offset(new Date('2015-11-01T00:00:00Z'), 'month', -1).getTime())
        .toBe(new Date('2015-10-01T00:00:00Z').getTime());
    expect(time.offset(new Date('2015-10-01T00:00:00Z'), 'month', 2).getTime()).toBe(new Date('2015-12-01T00:00:00Z')
        .getTime());
    expect(time.offset(new Date('2015-12-01T00:00:00Z'), 'month', -2).getTime())
        .toBe(new Date('2015-10-01T00:00:00Z').getTime());
  });

  it('should convert utc dates to local time', function() {
    var utcDate = new Date(2000, 0, 1, 23, 30, 0, 99);
    var localDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
    expect(time.toLocalDate(utcDate).getTime()).toBe(localDate.getTime());
  });

  it('should convert local dates to utc', function() {
    var localDate = new Date(2000, 0, 1, 23, 30, 0, 99);
    var utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
    expect(time.toUTCDate(localDate).getTime()).toBe(utcDate.getTime());
  });

  it('should format dates as a UNIX timestamp', function() {
    var date = new Date('2013-12-31T23:59:59Z');
    expect(time.formatDate(date, 'timestamp')).toBe(date.getTime().toString());
    expect(time.formatDate(date, 'timestamp', true)).toBe(date.getTime().toString());
  });

  it('should format dates using a UTC switch', function() {
    var date = new Date();
    var pattern = 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'';
    var formattedLocal = time.formatDate(date, pattern);
    var formattedLocalExplicit = time.formatDate(date, pattern, false);
    expect(formattedLocal).toBe(formattedLocalExplicit);

    var newDate = time.toLocalDate(date);
    var formattedUtc = time.formatDate(newDate, pattern, true);
    expect(formattedUtc).toBe(formattedLocal);
  });

  it('should apply offsets to dates', function() {
    // just fake init the settings
    Settings.getInstance().initialized_ = true;

    time.initOffset();
    time.applyOffset('UTC+04:15');
    expect(time.getTimeOffset()).toBe(4 * 60 * 60 * 1000 + 15 * 60 * 1000);
    expect(time.getTimeOffsetLabel()).toBe('+0415');
    expect(time.toOffsetString(0)).toBe('1970-01-01T04:15:00 +0415');

    time.applyOffset('-0600');
    expect(time.getTimeOffset()).toBe(-6 * 60 * 60 * 1000);
    expect(time.getTimeOffsetLabel()).toBe('-0600');
    expect(time.toOffsetString(0)).toBe('1969-12-31T18:00:00 -0600');

    // set these back to the default so other tests don't break
    time.applyOffset('+0000');
  });

  it('should trim time strings and Date objects', function() {
    var timeString = '2010-01-20T00:00:00.345Z';
    expect(time.trim(timeString)).toBe('2010-01-20T00:00:00Z');

    var date = new Date('2013-12-31T23:59:59.543Z');
    expect(time.trim(date)).toBe('2013-12-31T23:59:59Z');
  });

  it('should detect the format correctly', function() {
    expect(time.detectFormat('2017:09:12::13:55:17', time.DATETIME_FORMATS, true)).toBe('YYYY:MM:DD::HH:mm:ss');
    expect(time.detectFormat('2017:09:12::13:55:17.1', time.DATETIME_FORMATS, true))
        .toBe('YYYY:MM:DD::HH:mm:ss.SSSS');
    expect(time.detectFormat('2017:09:12::13:55:17.123456789', time.DATETIME_FORMATS, true))
        .toBe('YYYY:MM:DD::HH:mm:ss.SSSS');
  });

  it('should humanize durations without rounding', function() {
    expect(time.humanize(moment.duration(25, 'hours'))).toBe('1 day, 1 hour');
    expect(time.humanize(moment.duration(36, 'hours'))).toBe('1 day, 12 hours');
    expect(time.humanize(moment.duration(0))).toBe('0');
    // provide 0 duration output value
    expect(time.humanize(moment.duration(0), 'Real Time')).toBe('Real Time');
    // truncate millis
    expect(time.humanize(moment.duration(86401001))).toBe('1 day');
    expect(time.humanize(moment.duration(2, 'days'))).toBe('2 days');
    expect(time.humanize(moment.duration(50, 'hours'))).toBe('2 days, 2 hours');
    expect(time.humanize(moment.duration(2883, 'minutes'))).toBe('2 days, 3 minutes');
  });

  it('should get the step between two dates properly', function() {
    const hour_ = (1000 * 60 * 60);
    const day_ = (1000 * 60 * 60 * 24);
    const week_ = (1000 * 60 * 60 * 24 * 7);

    var d1 = new Date(2000, 1, 1, 23, 30, 0, 99); // leap year
    var d2 = new Date(2001, 1, 1, 23, 30, 0, 99);
    var d3 = new Date(2004, 1, 1, 23, 30, 0, 99); // leap year
    var d4 = new Date(2005, 1, 1, 23, 30, 0, 99);
    var d5 = new Date(2100, 1, 1, 23, 30, 0, 99); // special-case non-leap year
    var d6 = new Date(2016, 11, 31, 0, 0, 0, 0); // leap second

    // inconsistent number of milliseconds per month / year
    expect(time.step(d1, Duration.YEAR, 1)).toBe(366 * day_);
    expect(time.step(d2, Duration.YEAR, 1)).toBe(365 * day_);
    expect(time.step(d1, Duration.YEAR, 1)).toBe(d2.getTime() - d1.getTime());
    expect(time.step(d1, Duration.YEAR, 4)).toBe(d3.getTime() - d1.getTime());
    expect(time.step(d1, Duration.YEAR, 5)).toBe(d4.getTime() - d1.getTime());
    expect(time.step(d2, Duration.YEAR, 3)).toBe(d3.getTime() - d2.getTime());
    expect(time.step(d3, Duration.YEAR, 1)).toBe(d4.getTime() - d3.getTime());
    expect(time.step(d3, Duration.MONTH, 1)).toBe(29 * day_);
    expect(time.step(d3, Duration.MONTH, 2)).toBe(60 * day_); // 29 + 31
    expect(time.step(d3, Duration.MONTH, 3)).toBe(90 * day_); // 29 + 31 + 30
    expect(time.step(d4, Duration.MONTH, 1)).toBe(28 * day_);
    expect(time.step(d5, Duration.MONTH, 1)).toBe(28 * day_);

    // inconsistent number of milliseconds per day... not supported by JavaScript Date
    expect(time.step(d6, Duration.DAY, 1)).toBe(day_); // + 1000);

    // consistent number of milliseconds per hour, day, week
    expect(time.step(d1, Duration.HOURS, 1)).toBe(hour_);
    expect(time.step(d1, Duration.DAY, 1)).toBe(day_);
    expect(time.step(d1, Duration.WEEK, 1)).toBe(week_);

    var scale = 3;
    expect(time.step(d1, Duration.HOURS, scale)).toBe(scale * hour_);
    expect(time.step(d1, Duration.DAY, scale)).toBe(scale * day_);
    expect(time.step(d1, Duration.WEEK, scale)).toBe(scale * week_);
  });

  it('should combine separate date time fields correctly', function() {
    var d1 = '2020-12-24';
    var t1 = '23:59:59';

    var d2 = '08/29/1996';
    var t2 = '235959';
    var df2 = 'MM/DD/YYYY';
    var tf2 = 'HHmmss';

    var d3 = '07/25/1996';
    var t3 = '120000';

    expect(time.combineDateTime(d1, t1).valueOf()).toBe(new Date('2020-12-24T23:59:59Z')
        .getTime());
    expect(time.combineDateTime(d2, t2, df2, tf2).valueOf()).toBe(new Date('1996-08-29T23:59:59Z')
        .getTime());
    expect(isNaN(time.combineDateTime(d1, '').valueOf())).toBe(true);
    expect(isNaN(time.combineDateTime('', t1).valueOf())).toBe(true);
    expect(isNaN(time.combineDateTime(d3, t3).valueOf())).toBe(true);
  });
});

goog.require('os.time');


/**
 * Tests for os.time utility functions.
 */
describe('os.time', function() {
  it('should format dates properly', function() {
    var date = new Date('2010-01-20T01:02:03Z');

    expect(os.time.format(date)).toBe('2010-01-20 01:02:03');
    expect(os.time.format(date, '', false, true)).toBe('2010-01-20T01:02:03Z');
    expect(os.time.format(date, '', true)).toBe('2010-01-20');

    expect(os.time.format(date, 'day')).toBe('2010-01-20');
    expect(os.time.format(date, 'week')).toBe('2010-01-20');
    expect(os.time.format(date, 'month')).toBe('2010-01');
    expect(os.time.format(date, 'year')).toBe('2010');
  });

  it('should ceiling dates properly', function() {
    expect(os.time.ceil(new Date('2010-01-20T00:00:00Z'), 'sec').getTime()).toBe(new Date('2010-01-20T00:00:00Z')
        .getTime());
    expect(os.time.ceil(new Date('2010-01-20T00:00:00.100Z'), 'sec').getTime()).toBe(new Date('2010-01-20T00:00:01Z')
        .getTime());

    expect(os.time.ceil(new Date('2010-01-20T00:00:00Z'), 'min').getTime()).toBe(new Date('2010-01-20T00:00:00Z')
        .getTime());
    expect(os.time.ceil(new Date('2010-01-20T00:00:01Z'), 'min').getTime()).toBe(new Date('2010-01-20T00:01:00Z')
        .getTime());

    expect(os.time.ceil(new Date('2010-01-20T00:00:00Z'), 'hour').getTime()).toBe(new Date('2010-01-20T00:00:00Z')
        .getTime());
    expect(os.time.ceil(new Date('2010-01-20T00:00:01Z'), 'hour').getTime()).toBe(new Date('2010-01-20T01:00:00Z')
        .getTime());

    expect(os.time.ceil(new Date('2010-01-20T00:00:00Z'), 'day').getTime()).toBe(new Date('2010-01-20T00:00:00Z')
        .getTime());
    expect(os.time.ceil(new Date('2010-01-20T00:00:01Z'), 'day').getTime()).toBe(new Date('2010-01-21T00:00:00Z')
        .getTime());

    expect(os.time.ceil(new Date('2013-03-03T00:00:00Z'), 'week').getTime()).toBe(new Date('2013-03-03T00:00:00Z')
        .getTime());
    expect(os.time.ceil(new Date('2013-03-03T00:00:01Z'), 'week').getTime()).toBe(new Date('2013-03-10T00:00:00Z')
        .getTime());

    expect(os.time.ceil(new Date('2010-03-01T00:00:00Z'), 'month').getTime()).toBe(new Date('2010-03-01T00:00:00Z')
        .getTime());
    expect(os.time.ceil(new Date('2010-03-01T00:00:01Z'), 'month').getTime()).toBe(new Date('2010-04-01T00:00:00Z')
        .getTime());

    expect(os.time.ceil(new Date('2010-01-01T00:00:00Z'), 'year').getTime()).toBe(new Date('2010-01-01T00:00:00Z')
        .getTime());
    expect(os.time.ceil(new Date('2010-01-20T00:00:01Z'), 'year').getTime()).toBe(new Date('2011-01-01T00:00:00Z')
        .getTime());
  });

  it('should floor dates properly', function() {
    expect(os.time.floor(new Date('2013-01-15T00:00:00Z'), 'sec').getTime()).toBe(new Date('2013-01-15T00:00:00Z')
        .getTime());
    expect(os.time.floor(new Date('2013-01-15T00:00:00.999Z'), 'sec').getTime()).toBe(new Date('2013-01-15T00:00:00Z')
        .getTime());

    expect(os.time.floor(new Date('2013-01-15T00:00:00Z'), 'min').getTime()).toBe(new Date('2013-01-15T00:00:00Z')
        .getTime());
    expect(os.time.floor(new Date('2013-01-15T00:00:59Z'), 'min').getTime()).toBe(new Date('2013-01-15T00:00:00Z')
        .getTime());

    expect(os.time.floor(new Date('2013-01-15T00:00:00Z'), 'hour').getTime()).toBe(new Date('2013-01-15T00:00:00Z')
        .getTime());
    expect(os.time.floor(new Date('2013-01-15T00:59:59Z'), 'hour').getTime()).toBe(new Date('2013-01-15T00:00:00Z')
        .getTime());

    expect(os.time.floor(new Date('2013-01-15T00:00:00Z'), 'day').getTime()).toBe(new Date('2013-01-15T00:00:00Z')
        .getTime());
    expect(os.time.floor(new Date('2013-01-15T23:59:59Z'), 'day').getTime()).toBe(new Date('2013-01-15T00:00:00Z')
        .getTime());

    expect(os.time.floor(new Date('2013-03-03T00:00:00Z'), 'week').getTime()).toBe(new Date('2013-03-03T00:00:00Z')
        .getTime());
    expect(os.time.floor(new Date('2013-03-09T23:59:59Z'), 'week').getTime()).toBe(new Date('2013-03-03T00:00:00Z')
        .getTime());

    expect(os.time.floor(new Date('2013-03-01T00:00:00Z'), 'month').getTime()).toBe(new Date('2013-03-01T00:00:00Z')
        .getTime());
    expect(os.time.floor(new Date('2013-03-31T23:59:59Z'), 'month').getTime()).toBe(new Date('2013-03-01T00:00:00Z')
        .getTime());

    expect(os.time.floor(new Date('2013-01-01T00:00:00Z'), 'year').getTime()).toBe(new Date('2013-01-01T00:00:00Z')
        .getTime());
    expect(os.time.floor(new Date('2013-12-31T23:59:59Z'), 'year').getTime()).toBe(new Date('2013-01-01T00:00:00Z')
        .getTime());
  });

  it('should offset dates properly', function() {
    expect(os.time.offset(new Date('2013-01-15T00:00:00Z'), 'day', 1).getTime()).toBe(new Date('2013-01-16T00:00:00Z')
        .getTime());
    expect(os.time.offset(new Date('2013-01-15T00:00:00Z'), 'day', -1).getTime()).toBe(new Date('2013-01-14T00:00:00Z')
        .getTime());
    expect(os.time.offset(new Date('2013-01-15T00:00:00Z'), 'day', 2).getTime()).toBe(new Date('2013-01-17T00:00:00Z')
        .getTime());
    expect(os.time.offset(new Date('2013-01-15T00:00:00Z'), 'day', -2).getTime()).toBe(new Date('2013-01-13T00:00:00Z')
        .getTime());

    expect(os.time.offset(new Date('2013-03-15T00:00:00Z'), 'week', 1).getTime()).toBe(new Date('2013-03-22T00:00:00Z')
        .getTime());
    expect(os.time.offset(new Date('2013-03-15T00:00:00Z'), 'week', -1).getTime()).toBe(new Date('2013-03-08T00:00:00Z')
        .getTime());
    expect(os.time.offset(new Date('2013-03-15T00:00:00Z'), 'week', 2).getTime()).toBe(new Date('2013-03-29T00:00:00Z')
        .getTime());
    expect(os.time.offset(new Date('2013-03-15T00:00:00Z'), 'week', -2).getTime()).toBe(new Date('2013-03-01T00:00:00Z')
        .getTime());

    expect(os.time.offset(new Date('2013-03-01T00:00:00Z'), 'month', 1).getTime()).toBe(new Date('2013-04-01T00:00:00Z')
        .getTime());
    expect(os.time.offset(new Date('2013-03-01T00:00:00Z'), 'month', -1).getTime())
        .toBe(new Date('2013-02-01T00:00:00Z').getTime());
    expect(os.time.offset(new Date('2013-03-01T00:00:00Z'), 'month', 2).getTime()).toBe(new Date('2013-05-01T00:00:00Z')
        .getTime());
    expect(os.time.offset(new Date('2013-03-01T00:00:00Z'), 'month', -2).getTime())
        .toBe(new Date('2013-01-01T00:00:00Z').getTime());

    expect(os.time.offset(new Date('2013-01-01T00:00:00Z'), 'year', 1).getTime()).toBe(new Date('2014-01-01T00:00:00Z')
        .getTime());
    expect(os.time.offset(new Date('2013-01-01T00:00:00Z'), 'year', -1).getTime()).toBe(new Date('2012-01-01T00:00:00Z')
        .getTime());
    expect(os.time.offset(new Date('2013-01-01T00:00:00Z'), 'year', 2).getTime()).toBe(new Date('2015-01-01T00:00:00Z')
        .getTime());
    expect(os.time.offset(new Date('2013-01-01T00:00:00Z'), 'year', -2).getTime()).toBe(new Date('2011-01-01T00:00:00Z')
        .getTime());

    // do a couple around typical DST changes

    // fall back
    expect(os.time.offset(new Date('2015-10-31T00:00:00Z'), 'day', 1).getTime()).toBe(new Date('2015-11-01T00:00:00Z')
        .getTime());
    expect(os.time.offset(new Date('2015-11-01T00:00:00Z'), 'day', -1).getTime()).toBe(new Date('2015-10-31T00:00:00Z')
        .getTime());
    expect(os.time.offset(new Date('2015-10-31T00:00:00Z'), 'day', 2).getTime()).toBe(new Date('2015-11-02T00:00:00Z')
        .getTime());
    expect(os.time.offset(new Date('2015-11-02T00:00:00Z'), 'day', -2).getTime()).toBe(new Date('2015-10-31T00:00:00Z')
        .getTime());

    expect(os.time.offset(new Date('2015-10-25T00:00:00Z'), 'week', 1).getTime()).toBe(new Date('2015-11-01T00:00:00Z')
        .getTime());
    expect(os.time.offset(new Date('2015-11-01T00:00:00Z'), 'week', -1).getTime()).toBe(new Date('2015-10-25T00:00:00Z')
        .getTime());
    expect(os.time.offset(new Date('2015-10-25T00:00:00Z'), 'week', 2).getTime()).toBe(new Date('2015-11-08T00:00:00Z')
        .getTime());
    expect(os.time.offset(new Date('2015-11-08T00:00:00Z'), 'week', -2).getTime()).toBe(new Date('2015-10-25T00:00:00Z')
        .getTime());

    expect(os.time.offset(new Date('2015-10-01T00:00:00Z'), 'month', 1).getTime()).toBe(new Date('2015-11-01T00:00:00Z')
        .getTime());
    expect(os.time.offset(new Date('2015-11-01T00:00:00Z'), 'month', -1).getTime())
        .toBe(new Date('2015-10-01T00:00:00Z').getTime());
    expect(os.time.offset(new Date('2015-10-01T00:00:00Z'), 'month', 2).getTime()).toBe(new Date('2015-12-01T00:00:00Z')
        .getTime());
    expect(os.time.offset(new Date('2015-12-01T00:00:00Z'), 'month', -2).getTime())
        .toBe(new Date('2015-10-01T00:00:00Z').getTime());
  });

  it('should convert utc dates to local time', function() {
    var utcDate = new Date(2000, 0, 1, 23, 30, 0, 99);
    var localDate = new Date(utcDate.getTime() + utcDate.getTimezoneOffset() * 60000);
    expect(os.time.toLocalDate(utcDate).getTime()).toBe(localDate.getTime());
  });

  it('should convert local dates to utc', function() {
    var localDate = new Date(2000, 0, 1, 23, 30, 0, 99);
    var utcDate = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000);
    expect(os.time.toUTCDate(localDate).getTime()).toBe(utcDate.getTime());
  });

  it('should format dates as a UNIX timestamp', function() {
    var date = new Date('2013-12-31T23:59:59Z');
    expect(os.time.formatDate(date, 'timestamp')).toBe(date.getTime().toString());
    expect(os.time.formatDate(date, 'timestamp', true)).toBe(date.getTime().toString());
  });

  it('should format dates using a UTC switch', function() {
    var date = new Date();
    var pattern = 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'';
    var formattedLocal = os.time.formatDate(date, pattern);
    var formattedLocalExplicit = os.time.formatDate(date, pattern, false);
    expect(formattedLocal).toBe(formattedLocalExplicit);

    var newDate = os.time.toLocalDate(date);
    var formattedUtc = os.time.formatDate(newDate, pattern, true);
    expect(formattedUtc).toBe(formattedLocal);
  });

  it('should apply offsets to dates', function() {
    // just fake init the settings
    os.settings.initialized_ = true;

    os.time.initOffset();
    os.time.applyOffset('UTC+04:15');
    expect(os.time.timeOffset).toBe(4 * 60 * 60 * 1000 + 15 * 60 * 1000);
    expect(os.time.timeOffsetLabel).toBe('+0415');
    expect(os.time.toOffsetString(0)).toBe('1970-01-01 04:15:00 +0415');

    os.time.applyOffset('-0600');
    expect(os.time.timeOffset).toBe(-6 * 60 * 60 * 1000);
    expect(os.time.timeOffsetLabel).toBe('-0600');
    expect(os.time.toOffsetString(0)).toBe('1969-12-31 18:00:00 -0600');

    // set these back to the default so other tests don't break
    os.time.applyOffset('+0000');
  });

  it('should trim time strings and Date objects', function() {
    var timeString = '2010-01-20T00:00:00.345Z';
    expect(os.time.trim(timeString)).toBe('2010-01-20T00:00:00Z');

    var date = new Date('2013-12-31T23:59:59.543Z');
    expect(os.time.trim(date)).toBe('2013-12-31T23:59:59Z');
  });

  it('should detect the format correctly', function() {
    expect(os.time.detectFormat('2017:09:12::13:55:17', os.time.DATETIME_FORMATS, true)).toBe('YYYY:MM:DD::HH:mm:ss');
    expect(os.time.detectFormat('2017:09:12::13:55:17.1', os.time.DATETIME_FORMATS, true))
        .toBe('YYYY:MM:DD::HH:mm:ss.SSSS');
    expect(os.time.detectFormat('2017:09:12::13:55:17.123456789', os.time.DATETIME_FORMATS, true))
        .toBe('YYYY:MM:DD::HH:mm:ss.SSSS');
  });

  it('should humanize durations without rounding', function() {
    expect(os.time.humanize(moment.duration(25, 'hours'))).toBe('1 day, 1 hour');
    expect(os.time.humanize(moment.duration(36, 'hours'))).toBe('1 day, 12 hours');
    expect(os.time.humanize(moment.duration(0))).toBe('0');
    // provide 0 duration output value
    expect(os.time.humanize(moment.duration(0), 'Real Time')).toBe('Real Time');
    // truncate millis
    expect(os.time.humanize(moment.duration(86401001))).toBe('1 day');
    expect(os.time.humanize(moment.duration(2, 'days'))).toBe('2 days');
    expect(os.time.humanize(moment.duration(50, 'hours'))).toBe('2 days, 2 hours');
    expect(os.time.humanize(moment.duration(2883, 'minutes'))).toBe('2 days, 3 minutes');
  });
});

/**
 * Namespace for time utilities.
 *
 * These time utilities depend critically on the presence of at least version 2.8.3 of moment.js
 */
goog.provide('os.time');
goog.provide('os.time.Duration');

goog.require('goog.asserts');
goog.require('goog.date.DateTime');
goog.require('goog.date.UtcDateTime');
goog.require('goog.events.EventType');
goog.require('goog.i18n.DateTimeFormat');
goog.require('os.config.Settings');
goog.require('os.time.TimeRange');
goog.require('os.time.TimeRangePresets');


/**
 * @enum {string}
 */
os.time.Duration = {
  HOURS: 'hours',
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
  CUSTOM: 'custom'
};


/**
 * Preconfigured date formats.
 * @type {!Array<string>}
 * @const
 */
os.time.DATE_FORMATS = [
  'YYYY-MM-DD',
  'YYYY/MM/DD',
  'YYYYMMDD',

  'MM-DD-YYYY',
  'MM/DD/YYYY',
  'MMDDYYYY',

  'DD-MM-YYYY',
  'DD/MM/YYYY',
  'DDMMYYYY'
];


/**
 * @type {!Object<string, RegExp>}
 */
os.time.DATE_REGEXES = {
  'instant': (/((up|start|begin).*)?(day|date|doi)/i),
  'start': (/((up|start|begin).*)?(day|date|doi)/i),
  'end': (/(down|stop|end).*(day|date|doi)/i)
};


/**
 * Preconfigured date/time formats.
 * @type {!Array<string>}
 * @const
 */
os.time.DATETIME_FORMATS = [
  'YYYY-MM-DDTHH:mm:ss.SSSZ',
  'YYYY-MM-DDTHH:mm:ss.SSSZZ',
  'YYYY-MM-DDTHH:mm:ss.SSS',
  'YYYY-MM-DDTHH:mm:ss.SSSSZ',
  'YYYY-MM-DDTHH:mm:ss.SSSSZZ',
  'YYYY-MM-DDTHH:mm:ss.SSSS',
  'YYYY-MM-DDTHH:mm:ssZ',
  'YYYY-MM-DDTHH:mm:ssZZ',
  'YYYY-MM-DDTHH:mm:ss',
  'YYYY-MM-DDTHH:mmZ',
  'YYYY-MM-DDTHH:mmZZ',
  'YYYY-MM-DDTHH:mm',

  'YYYY-MM-DD HH:mm:ss.SSSZ',
  'YYYY-MM-DD HH:mm:ss.SSSZZ',
  'YYYY-MM-DD HH:mm:ss.SSS',
  'YYYY-MM-DD HH:mm:ss.SSSSZ',
  'YYYY-MM-DD HH:mm:ss.SSSSZZ',
  'YYYY-MM-DD HH:mm:ss.SSSS',
  'YYYY-MM-DD HH:mm:ssZ',
  'YYYY-MM-DD HH:mm:ssZZ',
  'YYYY-MM-DD HH:mm:ss',
  'YYYY-MM-DD HH:mmZ',
  'YYYY-MM-DD HH:mmZZ',
  'YYYY-MM-DD HH:mm',

  'YYYY/MM/DD HH:mm:ss.SSSZ',
  'YYYY/MM/DD HH:mm:ss.SSSZZ',
  'YYYY/MM/DD HH:mm:ss.SSS',
  'YYYY/MM/DD HH:mm:ss.SSSSZ',
  'YYYY/MM/DD HH:mm:ss.SSSSZZ',
  'YYYY/MM/DD HH:mm:ss.SSSS',
  'YYYY/MM/DD HH:mm:ssZ',
  'YYYY/MM/DD HH:mm:ssZZ',
  'YYYY/MM/DD HH:mm:ss',
  'YYYY/MM/DD HH:mmZ',
  'YYYY/MM/DD HH:mmZZ',
  'YYYY/MM/DD HH:mm',

  'YYYY:MM:DD::HH:mm:ss.SSSZ',
  'YYYY:MM:DD::HH:mm:ss.SSSZZ',
  'YYYY:MM:DD::HH:mm:ss.SSS',
  'YYYY:MM:DD::HH:mm:ss.SSSSZ',
  'YYYY:MM:DD::HH:mm:ss.SSSSZZ',
  'YYYY:MM:DD::HH:mm:ss.SSSS',
  'YYYY:MM:DD::HH:mm:ssZ',
  'YYYY:MM:DD::HH:mm:ssZZ',
  'YYYY:MM:DD::HH:mm:ss',
  'YYYY:MM:DD::HH:mmZ',
  'YYYY:MM:DD::HH:mmZZ',
  'YYYY:MM:DD::HH:mm',

  'YYYYMMDDTHHmmssZ',
  'YYYYMMDDTHHmmss',
  'YYYYMMDDHHmmssZ',
  'YYYYMMDDHHmmss',

  'MM/DD/YYYY HH:mm:ssZ',
  'MM/DD/YYYY HH:mm:ss',
  'MM/DD/YYYY HH:mmZ',
  'MM/DD/YYYY HH:mm',

  'MM/DD/YY HH:mm:ssZ',
  'MM/DD/YY HH:mm:ss',
  'MM/DD/YY HH:mmZ',
  'MM/DD/YY HH:mm'
];


/**
 * Additional formats to try in moment, though these won't be provided as drop-down options.
 * @type {!Array<string>}
 * @const
 */
os.time.CUSTOM_DATETIME_FORMATS = [
  'YYYY-MM-DDTHH:mm:ss.SSS Z',
  'YYYY-MM-DDTHH:mm:ss.SSSS Z',
  'YYYY-MM-DDTHH:mm:ss.SS Z',
  'YYYY-MM-DDTHH:mm:ss.S Z',
  'YYYY-MM-DDTHH:mm:ss.SSSSZ',
  'YYYY-MM-DDTHH:mm:ss.SSSZ',
  'YYYY-MM-DDTHH:mm:ss.SSZ',
  'YYYY-MM-DDTHH:mm:ss.SZ',
  'YYYY-MM-DDTHH:mm:ss.SSSS',
  'YYYY-MM-DDTHH:mm:ss.SSS',
  'YYYY-MM-DDTHH:mm:ss.SS',
  'YYYY-MM-DDTHH:mm:ss.S',
  'YYYY-MM-DDTHH:mm:ss Z',
  'YYYY-MM-DDTHH:mm Z',

  'YYYY-MM-DD HH:mm:ss.SSS Z',
  'YYYY-MM-DD HH:mm:ss.SSSS Z',
  'YYYY-MM-DD HH:mm:ss.SS Z',
  'YYYY-MM-DD HH:mm:ss.S Z',
  'YYYY-MM-DD HH:mm:ss.SSSSZ',
  'YYYY-MM-DD HH:mm:ss.SSSZ',
  'YYYY-MM-DD HH:mm:ss.SSZ',
  'YYYY-MM-DD HH:mm:ss.SZ',
  'YYYY-MM-DD HH:mm:ss.SS',
  'YYYY-MM-DD HH:mm:ss.S',
  'YYYY-MM-DD HH:mm:ss Z',
  'YYYY-MM-DD HH:mm Z',

  'YYYY/MM/DD HH:mm:ss.SSS Z',
  'YYYY/MM/DD HH:mm:ss.SSSS Z',
  'YYYY/MM/DD HH:mm:ss.SS Z',
  'YYYY/MM/DD HH:mm:ss.S Z',
  'YYYY/MM/DD HH:mm:ss.SSSZ',
  'YYYY/MM/DD HH:mm:ss.SSSSZ',
  'YYYY/MM/DD HH:mm:ss.SSZ',
  'YYYY/MM/DD HH:mm:ss.SZ',
  'YYYY/MM/DD HH:mm:ss.SSSS',
  'YYYY/MM/DD HH:mm:ss.SS',
  'YYYY/MM/DD HH:mm:ss.S',
  'YYYY/MM/DD HH:mm:ss Z',
  'YYYY/MM/DD HH:mm Z',

  'MM/DD/YYYY HH:mm:ss Z',
  'MM/DD/YYYY HH:mm Z',
  'MM/DD/YY HH:mm:ss Z',
  'MM/DD/YY HH:mm Z',

  'YYDDDHHmmss',
  'YYYYMMDD HHmmss'
];


/**
 * @type {!Object<string, RegExp>}
 */
os.time.DATETIME_REGEXES = {
  'instant': (/((up|start|begin).*)?(date|time)/i),
  'start': (/((up|start|begin).*)?(date|time)/i),
  'end': (/(down|stop|end).*(date|time)/i)
};


/**
 * Preconfigured time formats.
 * @type {!Array<string>}
 * @const
 */
os.time.TIME_FORMATS = [
  'HH:mm:ssZ',
  'HH:mm:ss',
  'HH:mm:ss.SSSZ',
  'HH:mm:ss.SSS',
  'HH:mm:ss.SSSSZ',
  'HH:mm:ss.SSSS',

  'HH:mmZ',
  'HH:mm',

  'HHmmssZ',
  'HHmmss',
  'ZHHmmss',
  'HHmmss.SSSZ',
  'HHmmss.SSS',
  'HHmmss.SSSSZ',
  'HHmmss.SSSS',
  'HHmmZ',
  'ZHHmm',
  'K*m*s a z'
];


/**
 * Additional formats to try in moment, though these won't be provided as drop-down options.
 * @type {!Array<string>}
 * @const
 */
os.time.CUSTOM_TIME_FORMATS = [
  'HH:mm:ss.SSS',
  'HH:mm:ss.SSSS',
  'HH:mm:ss.SS',
  'HH:mm:ss.S',
  'HHmmss.SSSS',
  'HHmmss.SS',
  'HHmmss.S',

  'HH:mm:ss.SSSZ',
  'HH:mm:ss.SSSSZ',
  'HH:mm:ss.SSZ',
  'HH:mm:ss.SZ',
  'HHmmss.SSSSZ',
  'HHmmss.SSSZ',
  'HHmmss.SSZ',
  'HHmmss.SZ',

  'HH:mm:ss.SSS Z',
  'HH:mm:ss.SSSS Z',
  'HH:mm:ss.SS Z',
  'HH:mm:ss.S Z',
  'HHmmss.SSS Z',
  'HHmmss.SSSS Z',
  'HHmmss.SS Z',
  'HHmmss.S Z',
  'HH:mm:ss Z',
  'HH:mm Z',
  'HHmmss Z',
  'HHmm Z'
];


/**
 * @type {!Object<string, RegExp>}
 */
os.time.TIME_REGEXES = {
  'instant': (/((up|start|begin).*)?(time|toi)/i),
  'start': (/((up|start|begin).*)?(time|toi)/i),
  'end': (/(down|stop|end).*(time|toi)/i)
};


/**
 * @type {!os.time.TimeRange}
 * @const
 */
os.time.UNBOUNDED = new os.time.TimeRange(-Infinity, Infinity);


/**
 * Time offset from UTC in ms
 * @type {number}
 */
os.time.timeOffset = 0;


/**
 * Time offset label (e.g. "-0500")
 * @type {!string}
 */
os.time.timeOffsetLabel = 'Z';


/**
 * milliseconds in day
 * @type {number}
 * @const
 */
os.time.millisecondsInDay = 86400000;


/**
 * Rounds a date up to the specified duration. Using duration 'year' will always return Jan. 1 of
 * the following year. Using duration 'month' will always return the first of the following month.
 * Using duration 'day' will always return 00:00:00 of the following day. And so on and so forth for
 * hour, minute, and second durations.
 *
 * @param {Date} date The date to ceil
 * @param {string} duration The rounding threshold. 'year', 'month', 'week', 'day', 'hour', 'min', or 'sec'
 * @param {boolean=} opt_local If the passed date should be rounded using the local timezone (UTC is the default)
 * @return {Date} The rounded date
 */
os.time.ceil = function(date, duration, opt_local) {
  return opt_local ? os.time.roundLocal(date, duration, false) : os.time.round(date, duration, false);
};


/**
 * Floors a date to the specified duration. Using duration 'year' will always return Jan. 1 in
 * the current year. Using duration 'month' will give you the current year and the first of the current month.
 * Using 'Day' will return 0 hours, 0 min, 0 secs in the current day. And so on and so forth for hour, minute,
 * and second durations.
 *
 * @param {Date} date The date to floor
 * @param {string} duration The rounding threshold. 'year', 'month', 'week', 'day', 'hour', 'min', or 'sec'
 * @param {boolean=} opt_local If the passed date should be rounded using the local timezone (UTC is the default)
 * @return {Date} The floored date
 */
os.time.floor = function(date, duration, opt_local) {
  return opt_local ? os.time.roundLocal(date, duration) : os.time.round(date, duration);
};


/**
 * Formats a string for display based on the duration given.
 *
 * @param {Date} date The date
 * @param {string=} opt_duration When 'Year' then the format is YYYY, when 'Month' then YYYY-MM, 'Day' or 'Week' then
 *    YYYY-MM-DD, else 'YYYY-MM-DD hh:mm:ss'
 * @param {?boolean=} opt_limitToDays Limits the date representation to YYYY-MM-DD regardless of duration
 * @param {?boolean=} opt_serverFormat Whether or not to use the delimeters for WMS/WFS time parameters
 * @return {string} The formatted date string
 */
os.time.format = function(date, opt_duration, opt_limitToDays, opt_serverFormat) {
  var duration = (opt_duration || '').toLowerCase();
  var str = date.toISOString();

  if (duration == 'year') {
    // YYYY
    return str.slice(0, 4);
  } else if (duration == 'month') {
    // YYYY-MM
    return str.slice(0, 7);
  } else if (duration == 'day' || duration == 'week' || opt_limitToDays) {
    // YYYY-MM-DD
    return str.slice(0, 10);
  }
  // YYYY-MM-DD(T)HH:MM:SS(Z)
  // remove zero or unnecessary millis
  str = str.replace('.000', '');

  if (!opt_serverFormat) {
    str = str.replace('T', ' ');
    str = str.replace('Z', '');
  }

  return str;
};


/**
 * Formats a date to a string using a specified pattern.
 * @param {Date} date The date (in local time).
 * @param {string} pattern The date format (see goog.i18n.DateTimeFormat).
 * @param {boolean=} opt_utc If true, return the date in the UTC timezone.
 * @return {string} A formatted date.
 */
os.time.formatDate = function(date, pattern, opt_utc) {
  if (pattern == 'timestamp') {
    return date.getTime().toString();
  }

  if (opt_utc) {
    date = os.time.toUTCDate(date);
  }

  var formatter = new goog.i18n.DateTimeFormat(pattern);
  return formatter.format(date);
};


/**
 * Formats a date to a string using a specified pattern.
 * @param {Date} date The date (in local time).
 * @param {string=} opt_pattern The date format (see goog.i18n.DateTimeFormat).
 * @param {boolean=} opt_utc If true, return the date in the UTC timezone.
 * @return {string} A formatted date.
 */
os.time.momentFormat = function(date, opt_pattern, opt_utc) {
  var m = moment(date.toISOString());

  return opt_utc ? m.utc().format(opt_pattern) : m.format(opt_pattern);
};


/**
 * Offsets a date based on the current duration.
 * @param {Date} date The date to offset
 * @param {string} duration The duration of the offset
 * @param {number} offset Multiplier for the duration
 * @param {boolean=} opt_local Whether the incoming and outgoing dates are local or UTC
 * @return {Date} The new date
 */
os.time.offset = function(date, duration, offset, opt_local) {
  var newDate = opt_local ? os.time.toUTCDate(date) : new Date(date.getTime());

  switch (duration) {
    case os.time.Duration.CUSTOM:
      // fall through
    case os.time.Duration.HOURS:
      newDate.setUTCHours(newDate.getUTCHours() + offset);
      break;
    case os.time.Duration.DAY:
      newDate.setUTCDate(newDate.getUTCDate() + offset);
      break;
    case os.time.Duration.WEEK:
      newDate.setUTCDate(newDate.getUTCDate() + (offset * 7));
      break;
    case os.time.Duration.MONTH:
      newDate.setUTCMonth(newDate.getUTCMonth() + offset);
      break;
    case os.time.Duration.YEAR:
      newDate.setUTCFullYear(newDate.getUTCFullYear() + offset);
      break;
    default:
      break;
  }

  return opt_local ? os.time.toLocalDate(newDate) : newDate;
};


/**
 * Tries detecting the date/time format for the provided value.
 * @param {string} value The date/time value.
 * @param {Array<string>} formats The formats to try.
 * @param {boolean=} opt_utc If the date should be parsed in the UTC zone. Defaults to false.
 * @param {boolean=} opt_strict If the format should be strictly enforced. Defaults to true.
 * @return {?string} The detected format, or null if none detected.
 */
os.time.detectFormat = function(value, formats, opt_utc, opt_strict) {
  var m = os.time.parseMoment(value, formats, opt_utc, opt_strict);
  if (m.isValid()) {
    return os.time.userizeFormat_(m._f);
  }
  return null;
};


/**
 * Parses a date/time value with the provided format.
 * @param {string} value The date/time value.
 * @param {?string} format The date/time format.
 * @param {boolean=} opt_utc If the date should be parsed in the UTC zone. Defaults to false.
 * @param {boolean=} opt_strict If the format should be strictly enforced. Defaults to true.
 * @return {?Date} The ISO formatted date, or null if parsing failed.
 */
os.time.parse = function(value, format, opt_utc, opt_strict) {
  var m = os.time.parseMoment(value, format, opt_utc, opt_strict);
  if (m.isValid()) {
    return m.toDate();
  }
  return null;
};


/**
 * Parses a date/time value with the provided format into a moment object.
 * @param {string} value The date/time value.
 * @param {?(Array<string>|string)} formats The date/time format(s).
 * @param {boolean=} opt_utc If the date should be parsed in the UTC zone. Defaults to false.
 * @param {boolean=} opt_strict If the format should be strictly enforced. Defaults to true.
 * @return {!moment} The parsed moment object.
 */
os.time.parseMoment = function(value, formats, opt_utc, opt_strict) {
  var strict = goog.isDef(opt_strict) ? opt_strict : true;

  var momentFormats = [];
  if (goog.isArray(formats)) {
    for (var i = 0, n = formats.length; i < n; i++) {
      momentFormats.push(os.time.normalizeFormat_(formats[i]));
    }
  } else if (formats) {
    momentFormats.push(os.time.normalizeFormat_(formats));
  } else {
    momentFormats = os.time.DATETIME_FORMATS;
  }

  return opt_utc ? moment.utc(value, momentFormats, strict) : moment(value, momentFormats, strict);
};


/**
 * Parses an ISO-8601 duration string or a number time into a moment.duration. ISO-8601 durations look like:
 * 'P[n]Y[n]M[n]DT[n]H[n]M[n]S'
 * @param {(number|string|Object)} value The duration value.
 * @param {string=} opt_units The optional units string for number durations.
 * @return {!moment.duration} The parsed moment object.
 */
os.time.parseDuration = function(value, opt_units) {
  return moment.duration(value, opt_units);
};


/**
 * Normalizes the format for moment. MM, DD, etc will not match a single digit month/day, but single chars will match
 * double digit values.
 * @param {string} format The format string to normalize.
 * @return {string} Normalized format.
 * @private
 */
os.time.normalizeFormat_ = function(format) {
  return format.replace(/(M+|D+|H+|m+|s+)/g, function(match) {
    return match.length == 2 ? match[0] : match;
  });
};


/**
 * Normalizes the format for display to users, replacing single 'M' and 'D' instances with 'MM' and 'DD'.
 * @param {string} format The format string to normalize.
 * @return {string} Normalized format.
 * @private
 */
os.time.userizeFormat_ = function(format) {
  return format.replace(/(M+|D+|H+|m+|s+)/g, function(match) {
    return match.length == 1 ? (match + match) : match;
  });
};


/**
 * Rounds a date to the specified duration, rounding to the UTC time zone. Rounds down by default.
 * Example, rounding down from 2008-06-15 to month is 2008-06-01
 * @param {Date} date The date to round
 * @param {string} duration The rounding threshold. 'year', 'month', 'week', 'day', 'hour', 'min', or 'sec'
 * @param {boolean=} opt_roundDown Whether to round up or round down
 * @return {Date} The rounded date
 */
os.time.round = function(date, duration, opt_roundDown) {
  var testDate = new Date(date.getTime());
  var roundDown = !goog.isDef(opt_roundDown) || opt_roundDown;

  duration = duration.toLowerCase();

  switch (duration) {
    case 'year':
      testDate.setUTCMonth(0, 1);
      testDate.setUTCHours(0, 0, 0, 0);

      if (!roundDown && date.getTime() > testDate.getTime()) {
        testDate.setUTCFullYear(testDate.getUTCFullYear() + 1);
      }
      break;
    case 'month':
      testDate.setUTCDate(1);
      testDate.setUTCHours(0, 0, 0, 0);

      if (!roundDown && date.getTime() > testDate.getTime()) {
        testDate.setUTCMonth(testDate.getUTCMonth() + 1);
      }
      break;
    case 'week':
      testDate.setUTCDate(testDate.getUTCDate() - testDate.getUTCDay());
      testDate.setUTCHours(0, 0, 0, 0);

      if (!roundDown && date.getTime() > testDate.getTime()) {
        testDate.setUTCDate(testDate.getUTCDate() + 7);
      }
      break;
    // handle both custom and day the same
    case 'custom':
    case 'day':
      testDate.setUTCHours(0, 0, 0, 0);

      if (!roundDown && date.getTime() > testDate.getTime()) {
        testDate.setUTCDate(testDate.getUTCDate() + 1);
      }
      break;
    case 'hour':
      testDate.setUTCMinutes(0, 0, 0);

      if (!roundDown && date.getTime() > testDate.getTime()) {
        testDate.setUTCHours(testDate.getUTCHours() + 1);
      }
      break;
    case 'min':
      testDate.setUTCSeconds(0, 0);

      if (!roundDown && date.getTime() > testDate.getTime()) {
        testDate.setUTCMinutes(date.getUTCMinutes() + 1);
      }
      break;
    case 'sec':
      testDate.setUTCMilliseconds(0);

      if (!roundDown && date.getTime() > testDate.getTime()) {
        testDate.setUTCSeconds(date.getUTCSeconds() + 1);
      }
      break;
    default:
      break;
  }

  return testDate;
};


/**
 * Rounds a date to the specified duration, rounding to the local time zone. Rounds down by default.
 * Example, rounding down from 2008-06-15 to month is 2008-06-01
 * @param {Date} date The date to round
 * @param {string} duration The rounding threshold. 'year', 'month', 'week', 'day', 'hour', 'min', or 'sec'
 * @param {boolean=} opt_roundDown Whether to round up or round down
 * @return {Date} The rounded date
 */
os.time.roundLocal = function(date, duration, opt_roundDown) {
  return os.time.toLocalDate(os.time.round(os.time.toUTCDate(date), duration, opt_roundDown));
};


/**
 * Takes a date that was made in GMT and converts it to the same time in local time.
 * @param {Date} date
 * @return {Date}
 */
os.time.toLocalDate = function(date) {
  return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
};


/**
 * Takes a date that was made in local time and returns a date with the same time in GMT.
 * @param {Date} date
 * @return {Date}
 */
os.time.toUTCDate = function(date) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000);
};


/**
 * Takes a date or a time string and trims thousands of a decimal place.
 * @param {(Date|string)} date
 * @return {string}
 */
os.time.trim = function(date) {
  var result = '';
  if (date instanceof Date) {
    result = date.toISOString();
  } else {
    result = /** @type {string} */ (date);
  }

  return result.replace(/\.[0-9]{3}Z/, 'Z');
};


/**
 * Applies the time offset
 * @param {number} time The time in ms
 * @param {goog.date.UtcDateTime=} opt_date
 * @param {boolean=} opt_forceUtc force UTC timezone
 * @return {!string}
 */
os.time.toOffsetString = function(time, opt_date, opt_forceUtc) {
  if (!opt_date) {
    opt_date = new goog.date.UtcDateTime();
  }

  var offset = opt_forceUtc ? 0 : os.time.timeOffset;
  var label = os.time.timeOffsetLabel;

  if (offset) {
    opt_date.setTime(time + offset);
    return opt_date.toUTCIsoString(true, false) + ' ' + label;
  }

  opt_date.setTime(time);
  return opt_date.toUTCIsoString(true, true);
};


/**
 * @type {string}
 * @const
 */
os.time.OFFSET_KEY = 'time.offset';


/**
 * Initializes the time offset. Caller is responsible for cleaning up the listener with {@link os.time.disposeOffset}.
 */
os.time.initOffset = function() {
  os.time.updateOffset_();
  os.settings.listen(os.time.OFFSET_KEY, os.time.onOffsetChange_);
};


/**
 * Remove the time offset listener.
 */
os.time.disposeOffset = function() {
  os.settings.unlisten(os.time.OFFSET_KEY, os.time.onOffsetChange_);
};


/**
 * Updates offset from settings
 * @private
 */
os.time.updateOffset_ = function() {
  os.time.timeOffset = /** @type {number} */ (os.settings.get(['time', 'offset'], 0));
  os.time.timeOffsetLabel = /** @type {string} */ (os.settings.get(['time', 'offsetLabel'], 'Z'));
};


/**
 * @param {os.events.PropertyChangeEvent} e
 * @private
 */
os.time.onOffsetChange_ = function(e) {
  os.time.updateOffset_();
};


/**
 * @param {!string} offset
 */
os.time.applyOffset = function(offset) {
  offset = offset.replace(/(utc|[:])/gi, '');
  goog.asserts.assert(/^[+-]\d{4}$/i.test(offset));
  var sign = offset.substring(0, 1) == '-' ? -1 : 1;
  var h = parseInt(offset.substring(1, 3), 10);
  var m = parseInt(offset.substring(3, 5), 10);
  var ms = sign * (h * 60 * 60 * 1000 + m * 60 * 1000);

  if (ms === 0) {
    offset = 'Z';
  }

  // do the label first since the change to the offset is the one that will
  // fire listeners
  os.settings.set(['time', 'offsetLabel'], offset);
  os.settings.set(['time', 'offset'], ms);
};


/**
 * Compare function for two separate Date objects.
 * @param {Date} a
 * @param {Date} b
 * @return {number}
 */
os.time.dateCompare = function(a, b) {
  return goog.array.defaultCompare(b.toISOString(), a.toISOString());
};


/**
 * Moment.js duration humanize() rounds.  1 day, 3 hours becomes "1 day" and
 * 1 day, 12 hours becomes "2 days".  This returns duration in days, hours, minutes
 * without rounding and returns "0" or an optional zero duration value when the
 * duration is zero.
 * @param {moment.duration} duration
 * @param {string=} opt_zeroDurationValue String to output when duration is 0
 * @return {string}
 */
os.time.humanize = function(duration, opt_zeroDurationValue) {
  var invalidMsg = 'Invalid duration';
  try {
    var result = '';
    var days = Math.floor(duration.asDays());
    var hours = duration.hours();
    var minutes = duration.minutes();

    if (days > 0) {
      result += days + ' day' + (days > 1 ? 's' : '');
    }
    if (hours > 0) {
      if (result.length > 0) {
        result += ', ';
      }
      result += hours + ' hour' + (hours > 1 ? 's' : '');
    }
    if (minutes > 0) {
      if (result.length > 0) {
        result += ', ';
      }
      result += minutes + ' minute' + (minutes > 1 ? 's' : '');
    }

    if (result.length == 0) {
      return opt_zeroDurationValue || '0';
    } else {
      return result;
    }
  } catch (e) {
    return invalidMsg;
  }
};


/**
 * @type {string}
 * @const
 */
os.time.DEFAULT_TIME_FORMAT = os.time.DATETIME_FORMATS[6].replace('Z', '[Z]');


/**
 * @param {string} match The matched substring
 * @param {string} p1 The submatch group
 * @param {number} offset The offset of the matched substring within the total string
 * @param {string} str The total string
 * @return {string} The replacement
 * @private
 */
os.time.replaceNow_ = function(match, p1, offset, str) {
  var parts = os.net.VariableReplacer.getParts(p1);
  var value = parts[0] || 0;

  var num = parseFloat(value);
  if (!isNaN(num)) {
    value = num;
  }

  var duration = os.time.parseDuration(value);
  var date = new Date(Date.now() + duration.asMilliseconds());
  return os.time.momentFormat(date, parts[1] || os.time.DEFAULT_TIME_FORMAT, true);
};
os.net.VariableReplacer.add('now', os.time.replaceNow_);

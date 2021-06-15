goog.module('os.time.TimeRangePresets');
goog.module.declareLegacyNamespace();

const VariableReplacer = goog.require('os.net.VariableReplacer');
const time = goog.require('os.time');
const TimeRange = goog.require('os.time.TimeRange');
const TimelineController = goog.require('os.time.TimelineController');


/**
 * Time range presets for relative times
 * @enum {string}
 */
const RANGES = {
  TIMELINE: 'Timeline',
  LAST24: 'Last 24 Hours',
  LAST48: 'Last 48 Hours',
  LAST72: 'Last 72 Hours',
  LAST168: 'Last 168 Hours (1 Week)',
  TODAY: 'Today',
  YESTERDAY: 'Yesterday',
  THISWEEK: 'This Week',
  LASTWEEK: 'Last Week',
  THISMONTH: 'This Month',
  LAST30: 'Last 30 Days',
  LAST60: 'Last 60 Days',
  LAST90: 'Last 90 Days',
  THISYEAR: 'This Year'
};

/**
 * Gets the current date based off the timestring
 *
 * @param {!string} range
 * @return {TimeRange}
 */
const getDateFromRange = function(range) {
  var now = new Date();
  var begin;
  var end;
  var tr = null;
  switch (range) {
    case RANGES.TIMELINE:
      tr = TimelineController.getInstance().getCurrentTimeRange();
      break;
    case RANGES.TODAY:
      begin = time.floor(now, 'day');
      end = time.ceil(now, 'day');
      break;
    case RANGES.YESTERDAY:
      begin = time.floor(now, 'day');
      end = time.ceil(now, 'day');
      begin.setUTCDate(begin.getUTCDate() - 1);
      end.setUTCDate(end.getUTCDate() - 1);
      break;
    case RANGES.LAST24:
      end = now;
      begin = time.offset(end, 'hours', -24);
      break;
    case RANGES.LAST48:
      end = now;
      begin = time.offset(end, 'hours', -48);
      break;
    case RANGES.LAST72:
      end = now;
      begin = time.offset(end, 'hours', -72);
      break;
    case RANGES.LAST168:
      end = now;
      begin = time.offset(end, 'hours', -168);
      break;
    case RANGES.THISWEEK:
      begin = time.floor(now, 'week');
      end = time.ceil(now, 'week');
      break;
    case RANGES.LASTWEEK:
      begin = time.floor(now, 'week');
      end = time.ceil(now, 'week');
      begin.setUTCDate(begin.getUTCDate() - 7);
      end.setUTCDate(end.getUTCDate() - 7);
      break;
    case RANGES.THISMONTH:
      begin = time.floor(now, 'month');
      end = time.ceil(now, 'month');
      break;
    case RANGES.LAST30:
      end = time.ceil(now, 'day');
      begin = time.offset(end, 'day', -30);
      break;
    case RANGES.LAST60:
      end = time.ceil(now, 'day');
      begin = time.offset(end, 'day', -60);
      break;
    case RANGES.LAST90:
      end = time.ceil(now, 'day');
      begin = time.offset(end, 'day', -90);
      break;
    case RANGES.THISYEAR:
      begin = time.floor(now, 'year');
      end = time.ceil(now, 'year');
      break;
    default:
      break;
  }
  if (!tr && begin && end) {
    tr = new TimeRange(begin, end);
  }
  return tr;
};

/**
 * @param {string} match The matched substring
 * @param {string} p1 The submatch group
 * @param {number} offset The offset of the matched substring within the total string
 * @param {string} str The total string
 * @return {string} The replacement
 */
const replaceTime = function(match, p1, offset, str) {
  var parts = VariableReplacer.getParts(p1);
  var range = getDateFromRange(parts[1]);
  var date = new Date(parts[0] == 'start' ? range.getStart() : range.getEnd());
  return time.momentFormat(date, parts[2] || time.DEFAULT_TIME_FORMAT, true);
};

exports = {
  RANGES,
  getDateFromRange,
  replaceTime
};

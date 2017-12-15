goog.provide('os.time.TimeRangePresets');

goog.require('os.net.VariableReplacer');
goog.require('os.time.TimeRange');


/**
 * Time range presets for relative times
 * @enum {string}
 */
os.time.TimeRangePresets.RANGES = {
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
 * @param {!string} range
 * @return {os.time.TimeRange}
 */
os.time.TimeRangePresets.getDateFromRange = function(range) {
  var now = new Date();
  var begin;
  var end;
  var tr = null;
  switch (range) {
    case os.time.TimeRangePresets.RANGES.TIMELINE:
      tr = os.time.TimelineController.getInstance().getCurrentTimeRange();
      break;
    case os.time.TimeRangePresets.RANGES.TODAY:
      begin = os.time.floor(now, 'day');
      end = os.time.ceil(now, 'day');
      break;
    case os.time.TimeRangePresets.RANGES.YESTERDAY:
      begin = os.time.floor(now, 'day');
      end = os.time.ceil(now, 'day');
      begin.setUTCDate(begin.getUTCDate() - 1);
      end.setUTCDate(end.getUTCDate() - 1);
      break;
    case os.time.TimeRangePresets.RANGES.LAST24:
      end = now;
      begin = os.time.offset(end, 'hours', -24);
      break;
    case os.time.TimeRangePresets.RANGES.LAST48:
      end = now;
      begin = os.time.offset(end, 'hours', -48);
      break;
    case os.time.TimeRangePresets.RANGES.LAST72:
      end = now;
      begin = os.time.offset(end, 'hours', -72);
      break;
    case os.time.TimeRangePresets.RANGES.LAST168:
      end = now;
      begin = os.time.offset(end, 'hours', -168);
      break;
    case os.time.TimeRangePresets.RANGES.THISWEEK:
      begin = os.time.floor(now, 'week');
      end = os.time.ceil(now, 'week');
      break;
    case os.time.TimeRangePresets.RANGES.LASTWEEK:
      begin = os.time.floor(now, 'week');
      end = os.time.ceil(now, 'week');
      begin.setUTCDate(begin.getUTCDate() - 7);
      end.setUTCDate(end.getUTCDate() - 7);
      break;
    case os.time.TimeRangePresets.RANGES.THISMONTH:
      begin = os.time.floor(now, 'month');
      end = os.time.ceil(now, 'month');
      break;
    case os.time.TimeRangePresets.RANGES.LAST30:
      end = os.time.ceil(now, 'day');
      begin = os.time.offset(end, 'day', -30);
      break;
    case os.time.TimeRangePresets.RANGES.LAST60:
      end = os.time.ceil(now, 'day');
      begin = os.time.offset(end, 'day', -60);
      break;
    case os.time.TimeRangePresets.RANGES.LAST90:
      end = os.time.ceil(now, 'day');
      begin = os.time.offset(end, 'day', -90);
      break;
    case os.time.TimeRangePresets.RANGES.THISYEAR:
      begin = os.time.floor(now, 'year');
      end = os.time.ceil(now, 'year');
      break;
    default:
      break;
  }
  if (!tr && begin && end) {
    tr = new os.time.TimeRange(begin, end);
  }
  return tr;
};


/**
 * @param {string} match The matched substring
 * @param {string} p1 The submatch group
 * @param {number} offset The offset of the matched substring within the total string
 * @param {string} str The total string
 * @return {string} The replacement
 * @private
 */
os.time.TimeRangePresets.replaceTime_ = function(match, p1, offset, str) {
  var parts = os.net.VariableReplacer.getParts(p1);
  var range = os.time.TimeRangePresets.getDateFromRange(parts[1]);
  var date = new Date(parts[0] == 'start' ? range.getStart() : range.getEnd());
  return os.time.momentFormat(date, parts[2] || os.time.DEFAULT_TIME_FORMAT, true);
};
os.net.VariableReplacer.add('time', os.time.TimeRangePresets.replaceTime_);



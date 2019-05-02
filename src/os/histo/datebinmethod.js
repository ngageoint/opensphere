goog.provide('os.histo.DateBinMethod');
goog.provide('os.histo.DateBinType');
goog.provide('os.histo.DateRangeBinType');

goog.require('goog.object');
goog.require('os.histo.UniqueBinMethod');
goog.require('os.time.TimeInstant');


/**
 * @enum {string}
 */
os.histo.DateBinType = {
  UNIQUE: 'Unique',
  MINUTE: 'Minute',
  HOUR: 'Hour',
  HOUR_OF_DAY: 'Hour of Day',
  HOUR_OF_WEEK: 'Hour of Week',
  HOUR_OF_MONTH: 'Hour of Month',
  HOUR_OF_YEAR: 'Hour of Year',
  DAY: 'Day',
  DAY_OF_WEEK: 'Day of Week',
  WEEK: 'Week',
  MONTH: 'Month',
  MONTH_OF_YEAR: 'Month of Year',
  YEAR: 'Year'
};


/**
 * Provide the bin types that are capable of binning overlapping time ranges
 * @enum {boolean}
 */
os.histo.DateRangeBinType = {
  'Hour of Day': true,
  'Hour of Week': true,
  'Hour of Month': true,
  'Hour of Year': true,
  'Day of Week': true,
  'Month of Year': true,
  'Unique': false,
  'Hour': false,
  'Day': false,
  'Week': false,
  'Month': false,
  'Year': false
};


/**
 * @enum {Object.<string, Array.<string>>}
 */
os.histo.Labels = {
  'Hour of Day': ['0000', '0100', '0200', '0300', '0400', '0500', '0600', '0700', '0800', '0900', '1000', '1100',
    '1200', '1300', '1400', '1500', '1600', '1700', '1800', '1900', '2000', '2100', '2200', '2300'],
  'Day of Week': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  'Month of Year': ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December']
};



/**
 * @constructor
 * @extends {os.histo.UniqueBinMethod}
 */
os.histo.DateBinMethod = function() {
  os.histo.DateBinMethod.base(this, 'constructor');
  this.type = os.histo.DateBinMethod.TYPE;

  /**
   * @type {os.histo.DateBinType}
   * @private
   */
  this.binType_ = os.histo.DateBinType.HOUR_OF_DAY;
};
goog.inherits(os.histo.DateBinMethod, os.histo.UniqueBinMethod);


/**
 * @type {string}
 * @const
 */
os.histo.DateBinMethod.TYPE = 'Date';


/**
 * String to use when the date is absent or can't be read.
 * @type {string}
 * @const
 */
os.histo.DateBinMethod.INVALID_DATE = 'Invalid Date';


/**
 * "Unique" value used when a requested value cannot be coerced to a number. Crossfilter fails when values cannot be
 * directly compared, or when comparing mixed strings/numbers so this is used as a fallback number.
 *
 * @type {number}
 * @const
 */
os.histo.DateBinMethod.MAGIC = moment.utc('0867-05-03T09:00:00Z').valueOf();


/**
 * @return {os.histo.DateBinType}
 */
os.histo.DateBinMethod.prototype.getDateBinType = function() {
  return this.binType_;
};


/**
 * @param {os.histo.DateBinType} value
 */
os.histo.DateBinMethod.prototype.setDateBinType = function(value) {
  this.binType_ = value;
};


/**
 * Get the supported date bin types for this method.
 * @return {Array<string>}
 */
os.histo.DateBinMethod.prototype.getDateBinTypes = function() {
  return Object.values(os.histo.DateBinType);
};


/**
 * Get the maximum key for this date bin type, if there is one
 * @param {number} opt_timestamp
 * @return {number}
 */
os.histo.DateBinMethod.prototype.getTypeMax = function(opt_timestamp) {
  switch (this.getDateBinType()) {
    case os.histo.DateBinType.HOUR_OF_DAY:
      return 23;
    case os.histo.DateBinType.HOUR_OF_WEEK:
      return 167;
    case os.histo.DateBinType.DAY_OF_WEEK:
      return 6;
    case os.histo.DateBinType.HOUR_OF_MONTH:
      var start = new Date();
      var end = new Date();
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(0, 0, 0, 0);

      start.setUTCMonth(new Date(opt_timestamp).getUTCMonth(), 1);
      end.setUTCMonth(start.getUTCMonth() + 1, 1);

      return Math.floor((end.getTime() - start.getTime()) / (60 * 60 * 1000));
    case os.histo.DateBinType.HOUR_OF_YEAR:
      var start = new Date();
      var end = new Date();
      start.setUTCHours(0, 0, 0, 0);
      end.setUTCHours(0, 0, 0, 0);

      start.setUTCFullYear(new Date(opt_timestamp).getUTCFullYear(), 0, 1);
      end.setUTCFullYear(start.getUTCFullYear() + 1, 0, 1);

      return Math.floor((end.getTime() - start.getTime()) / (60 * 60 * 1000));
    default:
      return 0;
  }
};


/**
 * @inheritDoc
 */
os.histo.DateBinMethod.prototype.getSortLabelFnAsc = function() {
  return os.histo.bin.sortByKey;
};


/**
 * @inheritDoc
 */
os.histo.DateBinMethod.prototype.getSortLabelFnDesc = function() {
  return os.histo.bin.sortByKeyDesc;
};


/**
 * @inheritDoc
 */
os.histo.DateBinMethod.prototype.getValue = function(item) {
  var timestamp = os.histo.DateBinMethod.MAGIC;
  var value = this.valueFunction ? this.valueFunction(item, this.field) : item[this.field];

  if (value != null) {
    // we want to end up with millis since epoch
    //
    // Can't use instanceof here because of potential window context issues
    if (typeof value == 'object') {
      // try os.time.ITime
      try {
        timestamp = /** @type {os.time.TimeInstant} */ (value).getStart();
        var timedown = /** @type {os.time.TimeInstant} */ (value).getEnd();
        // keep only if timedown is defined and different from timestamp
        timedown = timedown && timedown !== timestamp ? timedown : undefined;
      } catch (e) {
        // didn't work - try Date
        try {
          timestamp = /** @type {Date} */ (value).getTime();
        } catch (e) {
        }
      }
    } else if (typeof value === 'string' || typeof value === 'number') {
      value = new Date(value).valueOf();
      if (!isNaN(parseFloat(value)) && isFinite(value)) {
        timestamp = value;
      }
    }
  }

  if (timestamp !== os.histo.DateBinMethod.MAGIC) {
    // avoid moment here if at all possible because moment.utc() is much slower than using native Date functions. it's
    // less impactful in getBinLabel because that is only called once per bin
    var d = new Date(/** @type {Object|number|string|null|undefined} */ (timestamp + os.time.timeOffset));
    var d2 = null;
    if (timedown && this.arrayKeys) {
      d2 = new Date(/** @type {Object|number|string|null|undefined} */ (timedown + os.time.timeOffset));
    }

    switch (this.binType_) {
      case os.histo.DateBinType.HOUR_OF_DAY:
        // 0-23
        var t1 = d.getUTCHours();
        if (!d2) {
          return this.arrayKeys ? [t1] : t1;
        }
        var t2 = d2.getUTCHours();
        var max = 23;
        return this.generateValues(t1, t2, max);
      case os.histo.DateBinType.HOUR_OF_WEEK:
        // 0 (Sunday) - 6 (Saturday) * 24 plus 0-23
        var t1 = d.getUTCDay() * 24 + d.getUTCHours();
        if (!d2) {
          return this.arrayKeys ? [t1] : t1;
        }
        var t2 = d2.getUTCDay() * 24 + d2.getUTCHours();
        var max = 167;
        return this.generateValues(t1, t2, max);
      case os.histo.DateBinType.HOUR_OF_MONTH:
        // 0 - [27-30] (end of month) * 24 plus 0-23
        var t1 = (d.getUTCDate() - 1) * 24 + d.getUTCHours();
        if (!d2) {
          return this.arrayKeys ? [t1] : t1;
        }
        var t2 = (d2.getUTCDate() - 1) * 24 + d2.getUTCHours();
        return this.generateValues(t1, t2, this.getTypeMax(d.valueOf()));
      case os.histo.DateBinType.HOUR_OF_YEAR:
        // the date minus the beginning of the year, rounded to hours
        var min = new Date(Date.UTC(d.getUTCFullYear(), 0));
        var t1 = Math.floor((d - min) / 1000 / 60 / 60);
        if (!d2) {
          return this.arrayKeys ? [t1] : t1;
        }
        var t2 = Math.floor((d2 - min) / 1000 / 60 / 60);
        return this.generateValues(t1, t2, this.getTypeMax(d.valueOf()));
      case os.histo.DateBinType.MONTH_OF_YEAR:
        // 0-11
        if (!d2) {
          var m = d.getUTCMonth();
          return this.arrayKeys ? [m] : m;
        }
        var max = 11;
        var m1 = d.getUTCMonth();
        var m2 = d2.getUTCMonth();
        return this.generateValues(m1, m2, max);
      case os.histo.DateBinType.DAY_OF_WEEK:
        // 0 (Sunday) - 6 (Saturday)
        var t1 = d.getUTCDay();
        if (!d2) {
          return this.arrayKeys ? [t1] : t1;
        }
        var t2 = d2.getUTCDay();
        var max = 6;
        return this.generateValues(t1, t2, max);
      case os.histo.DateBinType.MINUTE:
        return os.time.floor(d, 'min').getTime();
      case os.histo.DateBinType.HOUR:
        return os.time.floor(d, 'hour').getTime();
      case os.histo.DateBinType.DAY:
        return os.time.floor(d, 'day').getTime();
      case os.histo.DateBinType.WEEK:
        return os.time.floor(d, 'week').getTime();
      case os.histo.DateBinType.MONTH:
        return os.time.floor(d, 'month').getTime();
      case os.histo.DateBinType.YEAR:
        return os.time.floor(d, 'year').getTime();
      default:
        return timestamp;
    }
  }

  // always returning a number, so return the magic value as a number when no date is defined/found
  return timestamp;
};


/**
 * Get values for overlapping time bins, only gets called if start and end would be in different bins
 * @param {number} start
 * @param {number} end
 * @param {number} max
 * @return {Array<number>|number}
 */
os.histo.DateBinMethod.prototype.generateValues = function(start, end, max) {
  if (start == end) {
    return this.arrayKeys ? [start] : start;
  }
  if (start < end) {
    // output = [start..end]
    var output = new Array(end - start);
    for (var i = 0, ii = end - start; i <= ii; i++) {
      output[i] = start + i;
    }
  } else {
    // end is after start but in lower bin
    // output = [0..end,start..max]
    var output = new Array((max - start) + (end + 1));
    for (var i = end, ii = max - start + end; i <= ii; i++) {
      output[i + 1] = start + i - end;
    }
    for (var j = 0, jj = end; j <= jj; j++) {
      output[j] = j;
    }
  }
  return output;
};


/**
 * @inheritDoc
 */
os.histo.DateBinMethod.prototype.getBinKey = function(value) {
  if (Array.isArray(value)) {
    return value;
  }
  return Number(value) || value.toString();
};


/**
 * @inheritDoc
 */
os.histo.DateBinMethod.prototype.getBinLabel = function(item) {
  var value = this.getValue(item);
  // if value is a crossfilter key array, just get the last key
  value = Array.isArray(value) ? value[value.length - 1] : value;
  return this.getLabelForKey(/** @type {number|string} */ (value));
};


/**
 * @inheritDoc
 */
os.histo.DateBinMethod.prototype.getLabelForKey = function(key, opt_secondary, opt_smallLabel) {
  if (typeof key === 'string' && key.indexOf(os.data.xf.DataModel.SEPARATOR) >= 0) {
    // this key is in a bin that represents the intersection of two keys; split them apart with the separator
    key = !opt_secondary ? Number(key.split(os.data.xf.DataModel.SEPARATOR)[0]) :
        Number(key.split(os.data.xf.DataModel.SEPARATOR)[1]);
  }

  if (key !== undefined && key != os.histo.DateBinMethod.MAGIC) {
    switch (this.binType_) {
      case os.histo.DateBinType.HOUR_OF_DAY:
        // key is 0-23, so pad to 0000-2300
        return goog.string.padNumber(/** @type {number} */ (key), 2) + '00';
      case os.histo.DateBinType.DAY_OF_WEEK:
        // convert from 0-6 to Sunday-Saturday
        return moment().isoWeekday(/** @type {number} */ (key)).format('dddd');
      case os.histo.DateBinType.MINUTE:
        return moment.utc(/** @type {number} */ (key)).format('YYYY-MM-DD HH:mm');
      case os.histo.DateBinType.HOUR:
        return moment.utc(/** @type {number} */ (key)).format('YYYY-MM-DD HH');
      case os.histo.DateBinType.DAY:
        return moment.utc(/** @type {number} */ (key)).format('YYYY-MM-DD');
      case os.histo.DateBinType.WEEK:
        return moment.utc(/** @type {number} */ (key)).day(0).format('YYYY-MM-DD');
      case os.histo.DateBinType.MONTH:
        return moment.utc(/** @type {number} */ (key)).format('YYYY-MM');
      case os.histo.DateBinType.YEAR:
        return moment.utc(/** @type {number} */ (key)).format('YYYY');
      case os.histo.DateBinType.HOUR_OF_WEEK:
      case os.histo.DateBinType.HOUR_OF_MONTH:
      case os.histo.DateBinType.HOUR_OF_YEAR:
        return key.toString();
      case os.histo.DateBinType.MONTH_OF_YEAR:
        return moment.utc().month(/** @type {number} */ (key)).format('MMMM');
      default:
        return os.time.toOffsetString(/** @type {number} */ (key));
    }
  }

  return os.histo.DateBinMethod.INVALID_DATE;
};


/**
 * TODO: Implement this if pivot tables are ever needed
 * For this basic implementation types like DAY_OF_WEEK and HOUR_OF_DAY are assumed to be DAY and HOUR respectively
 * MONTH and YEAR are handled by momentjs
 * @inheritDoc
 */
os.histo.DateBinMethod.prototype.filterDimension = function(dimension, item) {
  var value = /** @type {number} */ (this.getValue(item));
  var width = 0;
  switch (this.binType_) {
    case os.histo.DateBinType.DAY:
    case os.histo.DateBinType.DAY_OF_WEEK:
      width = 1000 * 60 * 60 * 24;
      break;
    case os.histo.DateBinType.MINUTE:
      width = 1000 * 60;
      break;
    case os.histo.DateBinType.HOUR:
    case os.histo.DateBinType.HOUR_OF_DAY:
    case os.histo.DateBinType.HOUR_OF_WEEK:
    case os.histo.DateBinType.HOUR_OF_MONTH:
    case os.histo.DateBinType.HOUR_OF_YEAR:
      width = 1000 * 60 * 60;
      break;
    case os.histo.DateBinType.WEEK:
      width = 1000 * 60 * 60 * 24 * 7;
      break;
    case os.histo.DateBinType.MONTH:
      width = moment(value).add(1, 'months').valueOf();
      break;
    case os.histo.DateBinType.YEAR:
      width = moment(value).add(1, 'years').valueOf();
      break;
    default:
      width = 0;
      break;
  }
  dimension.filterRange([value, value + width + 1]);
};


/**
 * @inheritDoc
 */
os.histo.DateBinMethod.prototype.persist = function(opt_to) {
  opt_to = os.histo.DateBinMethod.base(this, 'persist', opt_to) || {};

  opt_to['binType'] = this.getDateBinType();
  return opt_to;
};


/**
 * @inheritDoc
 */
os.histo.DateBinMethod.prototype.restore = function(config) {
  os.histo.DateBinMethod.base(this, 'restore', config);

  var binType = /** @type {os.histo.DateBinType|undefined} */ (config['binType']);
  if (binType && goog.object.containsValue(os.histo.DateBinType, binType)) {
    this.setDateBinType(binType);
  }
};


/**
 * @inheritDoc
 */
os.histo.DateBinMethod.prototype.exportAsFilter = function(bins) {
  // don't create filters by date because they will conflict with the application date control
  return null;
};

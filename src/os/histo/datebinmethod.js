goog.module('os.histo.DateBinMethod');

const {containsValue} = goog.require('goog.object');
const {padNumber} = goog.require('goog.string');
const DataModel = goog.require('os.data.xf.DataModel');
const DateBinType = goog.require('os.histo.DateBinType');
const UniqueBinMethod = goog.require('os.histo.UniqueBinMethod');
const {sortByKey, sortByKeyDesc} = goog.require('os.histo.bin');
const time = goog.require('os.time');

const TimeInstant = goog.requireType('os.time.TimeInstant');


/**
 */
class DateBinMethod extends UniqueBinMethod {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.type = DateBinMethod.TYPE;

    /**
     * @type {DateBinType}
     * @private
     */
    this.binType_ = DateBinType.HOUR_OF_DAY;

    /**
     * The supported date bin types for this method
     * @type {Array<string>}
     * @private
     */
    this.binTypes_ = Object.values(DateBinType);
  }

  /**
   * @return {DateBinType}
   */
  getDateBinType() {
    return this.binType_;
  }

  /**
   * @param {DateBinType} value
   */
  setDateBinType(value) {
    this.binType_ = value;
  }

  /**
   * Set the supported date bin types for this method.
   * @param {Array<string>} values
   */
  setDateBinTypes(values) {
    this.binTypes_ = values;
  }

  /**
   * Get the supported date bin types for this method.
   *
   * @return {Array<string>}
   */
  getDateBinTypes() {
    return this.binTypes_;
  }

  /**
   * Get the maximum key for this date bin type, if there is one
   *
   * @param {number} opt_timestamp
   * @return {number}
   */
  getTypeMax(opt_timestamp) {
    switch (this.getDateBinType()) {
      case DateBinType.HOUR_OF_DAY:
        return 23;
      case DateBinType.HOUR_OF_WEEK:
        return 167;
      case DateBinType.DAY_OF_WEEK:
        return 6;
      case DateBinType.HOUR_OF_MONTH:
        var start = new Date();
        var end = new Date();
        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(0, 0, 0, 0);

        start.setUTCMonth(new Date(opt_timestamp).getUTCMonth(), 1);
        end.setUTCMonth(start.getUTCMonth() + 1, 1);

        return Math.floor((end.getTime() - start.getTime()) / (60 * 60 * 1000)) - 1; // goes from 0 to ((days * 24) - 1) hours
      case DateBinType.HOUR_OF_YEAR:
        var start = new Date();
        var end = new Date();
        start.setUTCHours(0, 0, 0, 0);
        end.setUTCHours(0, 0, 0, 0);

        start.setUTCFullYear(new Date(opt_timestamp).getUTCFullYear(), 0, 1);
        end.setUTCFullYear(start.getUTCFullYear() + 1, 0, 1);

        return Math.floor((end.getTime() - start.getTime()) / (60 * 60 * 1000)) - 1; // goes from 0 to ((days * 24) - 1) hours
      case DateBinType.MONTH_OF_YEAR:
        return 11;
      default:
        return 0;
    }
  }

  /**
   * @inheritDoc
   */
  getSortLabelFnAsc() {
    return sortByKey;
  }

  /**
   * @inheritDoc
   */
  getSortLabelFnDesc() {
    return sortByKeyDesc;
  }

  /**
   * @inheritDoc
   */
  getValue(item) {
    var timestamp = DateBinMethod.MAGIC;
    var value = this.valueFunction ? this.valueFunction(item, this.field) : item[this.field];

    if (value != null) {
      // we want to end up with millis since epoch
      //
      // Can't use instanceof here because of potential window context issues
      if (typeof value == 'object') {
        // try os.time.ITime
        try {
          timestamp = /** @type {TimeInstant} */ (value).getStart();
          var timedown = /** @type {TimeInstant} */ (value).getEnd();
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

    if (timestamp !== DateBinMethod.MAGIC) {
      // avoid moment here if at all possible because moment.utc() is much slower than using native Date functions. it's
      // less impactful in getBinLabel because that is only called once per bin
      var d = new Date(/** @type {Object|number|string|null|undefined} */ (timestamp + time.getTimeOffset()));
      var d2 = null;
      if (timedown && this.arrayKeys) {
        d2 = new Date(/** @type {Object|number|string|null|undefined} */ (timedown + time.getTimeOffset()));
      }

      switch (this.binType_) {
        case DateBinType.HOUR_OF_DAY:
          // 0-23
          var t1 = d.getUTCHours();
          if (!d2) {
            return this.arrayKeys ? [t1] : t1;
          }
          var t2 = d2.getUTCHours();
          var max = 23;
          return this.generateValues(t1, t2, max);
        case DateBinType.HOUR_OF_WEEK:
          // 0 (Sunday) - 6 (Saturday) * 24 plus 0-23
          var t1 = d.getUTCDay() * 24 + d.getUTCHours();
          if (!d2) {
            return this.arrayKeys ? [t1] : t1;
          }
          var t2 = d2.getUTCDay() * 24 + d2.getUTCHours();
          var max = 167;
          return this.generateValues(t1, t2, max);
        case DateBinType.HOUR_OF_MONTH:
          // 0 - [27-30] (end of month) * 24 plus 0-23
          var t1 = (d.getUTCDate() - 1) * 24 + d.getUTCHours();
          if (!d2) {
            return this.arrayKeys ? [t1] : t1;
          }
          var t2 = (d2.getUTCDate() - 1) * 24 + d2.getUTCHours();
          return this.generateValues(t1, t2, this.getTypeMax(d.valueOf()));
        case DateBinType.HOUR_OF_YEAR:
          // the date minus the beginning of the year, rounded to hours
          var min = new Date(Date.UTC(d.getUTCFullYear(), 0));
          var t1 = Math.floor((d - min) / 1000 / 60 / 60);
          if (!d2) {
            return this.arrayKeys ? [t1] : t1;
          }
          var t2 = Math.floor((d2 - min) / 1000 / 60 / 60);
          return this.generateValues(t1, t2, this.getTypeMax(d.valueOf()));
        case DateBinType.MONTH_OF_YEAR:
          // 0-11
          if (!d2) {
            var m = d.getUTCMonth();
            return this.arrayKeys ? [m] : m;
          }
          var max = 11;
          var m1 = d.getUTCMonth();
          var m2 = d2.getUTCMonth();
          return this.generateValues(m1, m2, max);
        case DateBinType.DAY_OF_WEEK:
          // 0 (Sunday) - 6 (Saturday)
          var t1 = d.getUTCDay();
          if (!d2) {
            return this.arrayKeys ? [t1] : t1;
          }
          var t2 = d2.getUTCDay();
          var max = 6;
          return this.generateValues(t1, t2, max);
        case DateBinType.MINUTE:
          return time.floor(d, 'min').getTime();
        case DateBinType.HOUR:
          return time.floor(d, 'hour').getTime();
        case DateBinType.DAY:
          return time.floor(d, 'day').getTime();
        case DateBinType.WEEK:
          return time.floor(d, 'week').getTime();
        case DateBinType.MONTH:
          return time.floor(d, 'month').getTime();
        case DateBinType.YEAR:
          return time.floor(d, 'year').getTime();
        default:
          return timestamp;
      }
    }

    // always returning a number, so return the magic value as a number when no date is defined/found
    return timestamp;
  }

  /**
   * Get values for overlapping time bins, only gets called if start and end would be in different bins
   *
   * @param {number} start
   * @param {number} end
   * @param {number} max
   * @return {Array<number>|number}
   */
  generateValues(start, end, max) {
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
  }

  /**
   * @inheritDoc
   */
  getBinKey(value) {
    if (Array.isArray(value)) {
      return value;
    }
    return Number(value) || value.toString();
  }

  /**
   * @inheritDoc
   */
  getBinLabel(item) {
    var value = this.getValue(item);
    // if value is a crossfilter key array, just get the last key
    value = Array.isArray(value) ? value[value.length - 1] : value;
    return this.getLabelForKey(/** @type {number|string} */ (value));
  }

  /**
   * @inheritDoc
   */
  getLabelForKey(key, opt_secondary, opt_smallLabel) {
    if (typeof key === 'string' && key.indexOf(DataModel.SEPARATOR) >= 0) {
      // this key is in a bin that represents the intersection of two keys; split them apart with the separator
      key = !opt_secondary ? Number(key.split(DataModel.SEPARATOR)[0]) :
        Number(key.split(DataModel.SEPARATOR)[1]);
    }

    if (key !== undefined && key != DateBinMethod.MAGIC) {
      switch (this.binType_) {
        case DateBinType.HOUR_OF_DAY:
          // key is 0-23, so pad to 0000-2300
          return padNumber(/** @type {number} */ (key), 2) + '00';
        case DateBinType.DAY_OF_WEEK:
          // convert from 0-6 to Sunday-Saturday
          return moment().isoWeekday(/** @type {number} */ (key)).format('dddd');
        case DateBinType.MINUTE:
          return moment.utc(/** @type {number} */ (key)).format('YYYY-MM-DD HH:mm');
        case DateBinType.HOUR:
          return moment.utc(/** @type {number} */ (key)).format('YYYY-MM-DD HH');
        case DateBinType.DAY:
          return moment.utc(/** @type {number} */ (key)).format('YYYY-MM-DD');
        case DateBinType.WEEK:
          return moment.utc(/** @type {number} */ (key)).day(0).format('YYYY-MM-DD');
        case DateBinType.MONTH:
          return moment.utc(/** @type {number} */ (key)).format('YYYY-MM');
        case DateBinType.YEAR:
          return moment.utc(/** @type {number} */ (key)).format('YYYY');
        case DateBinType.HOUR_OF_WEEK:
        case DateBinType.HOUR_OF_MONTH:
        case DateBinType.HOUR_OF_YEAR:
          return key.toString();
        case DateBinType.MONTH_OF_YEAR:
          return moment.utc().month(/** @type {number} */ (key)).format('MMMM');
        default:
          return time.toOffsetString(/** @type {number} */ (key));
      }
    }

    return DateBinMethod.INVALID_DATE;
  }

  /**
   * TODO: Implement this if pivot tables are ever needed
   * For this basic implementation types like DAY_OF_WEEK and HOUR_OF_DAY are assumed to be DAY and HOUR respectively
   * MONTH and YEAR are handled by momentjs
   *
   * @inheritDoc
   */
  filterDimension(dimension, item) {
    var value = /** @type {number} */ (this.getValue(item));
    var width = 0;
    switch (this.binType_) {
      case DateBinType.DAY:
      case DateBinType.DAY_OF_WEEK:
        width = 1000 * 60 * 60 * 24;
        break;
      case DateBinType.MINUTE:
        width = 1000 * 60;
        break;
      case DateBinType.HOUR:
      case DateBinType.HOUR_OF_DAY:
      case DateBinType.HOUR_OF_WEEK:
      case DateBinType.HOUR_OF_MONTH:
      case DateBinType.HOUR_OF_YEAR:
        width = 1000 * 60 * 60;
        break;
      case DateBinType.WEEK:
        width = 1000 * 60 * 60 * 24 * 7;
        break;
      case DateBinType.MONTH:
        width = moment(value).add(1, 'months').valueOf();
        break;
      case DateBinType.YEAR:
        width = moment(value).add(1, 'years').valueOf();
        break;
      default:
        width = 0;
        break;
    }
    dimension.filterRange([value, value + width + 1]);
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    opt_to = super.persist(opt_to) || {};

    opt_to['binType'] = this.getDateBinType();
    opt_to['binTypes'] = this.getDateBinTypes();

    return opt_to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    super.restore(config);

    var binType = /** @type {DateBinType|undefined} */ (config['binType']);
    if (binType && containsValue(DateBinType, binType)) {
      this.setDateBinType(binType);
    }

    var binTypes = /** @type {Array<string>|undefined} */ (config['binTypes']);
    if (binTypes) {
      this.setDateBinTypes(binTypes);
    }
  }

  /**
   * @inheritDoc
   */
  exportAsFilter(bins) {
    // don't create filters by date because they will conflict with the application date control
    return null;
  }

  /**
   * @inheritDoc
   */
  getStatsForBin(bins) {
    var result = super.getStatsForBin(bins);
    if (result == null) return result;

    var max1 = this.getTypeMax(result.range[0]);
    var max2 = this.getTypeMax(result.range[1]);

    if (max1 != 0 || max2 != 0) {
      // when the range is a logical time period, e.g. Day of Week, Hour of Day, etc
      result.range = [0, (max2 > max1 ? max2 : max1)];
      result.step = 1;
      result.binCountAll = ((result.range[1] - result.range[0]) / result.step) + 1;
    } else {
      // when the range is a specific time period, e.g. Jan 3rd thru Jan 17th
      var type = this.getDateBinType();
      var min = new Date(result.range[0]);
      var max = new Date(result.range[1]);
      var floor = 'sec';
      var step = 1000; // 1K milliseconds = 1 second
      switch (type) {
        case DateBinType.MINUTE:
          floor = 'min';
          step = step * 60;
          break;
        case DateBinType.HOUR:
          floor = 'hour';
          step = step * 60 * 60;
          break;
        case DateBinType.DAY:
          floor = 'day';
          step = step * 60 * 60 * 24;
          break;
        case DateBinType.WEEK:
          floor = 'week';
          step = step * 60 * 60 * 24 * 7;
          break;
        case DateBinType.MONTH:
          floor = 'month';
          step = DateBinMethod.MAGIC_MONTH_MILLIS; // approximate... you must detect this and then calculate the next step
          break;
        case DateBinType.YEAR:
          floor = 'year';
          step = DateBinMethod.MAGIC_YEAR_MILLIS; // approximate... you must detect this and then calculate the next step
          break;
        default:
          break;
      }
      result.range = [time.floor(min, floor).getTime(), time.floor(max, floor).getTime()];
      result.step = step;
      // For MONTH and YEAR, err on the side of too many bins, e.g. for years with 366 days, still give a bin when dividing by 365 days
      result.binCountAll = Math.round(((result.range[1] - result.range[0]) / result.step) + 1.0);
    }
    return result;
  }
}

/**
 * @type {string}
 * @override
 */
DateBinMethod.TYPE = 'Date';

/**
 * String to use when the date is absent or can't be read.
 * @type {string}
 * @const
 */
DateBinMethod.INVALID_DATE = 'Invalid Date';

/**
 * "Unique" value used when a requested value cannot be coerced to a number. Crossfilter fails when values cannot be
 * directly compared, or when comparing mixed strings/numbers so this is used as a fallback number.
 *
 * @type {number}
 * @const
 */
DateBinMethod.MAGIC = moment.utc('0867-05-03T09:00:00Z').valueOf();

/**
 * "Unique" value used to detect when generating empty bins across month(s)
 * WARNING: Over thousands of years, the stats.binCountAll estimate will get more and more off
 *
 * @type {number}
 * @const
 */
DateBinMethod.MAGIC_MONTH_MILLIS = 1000 * 60 * 60 * 2 * 365; // 2 = (24 / 12) i.e. days divided by 12 mo/yr

/**
 * "Unique" value used to detect when generating empty bins across year(s)
 * WARNING: Over thousands of years, the stats.binCountAll estimate will get more and more off
 *
 * @type {number}
 * @const
 */
DateBinMethod.MAGIC_YEAR_MILLIS = (1000 * 60 * 60 * 24 * 365);

exports = DateBinMethod;

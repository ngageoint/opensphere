goog.provide('os.histo.DateBinMethod');
goog.provide('os.histo.DateBinType');

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
  YEAR: 'Year'
};


/**
 * @enum {Object.<string, Array.<string>>}
 */
os.histo.Labels = {
  'Hour of Day': ['0000', '0100', '0200', '0300', '0400', '0500', '0600', '0700', '0800', '0900', '1000', '1100',
    '1200', '1300', '1400', '1500', '1600', '1700', '1800', '1900', '2000', '2100', '2200', '2300'],
  'Day of Week': ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
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

  if (goog.isDefAndNotNull(value)) {
    // we want to end up with millis since epoch
    //
    // Can't use instanceof here because of potential window context issues
    if (typeof value == 'object') {
      // try os.time.ITime
      try {
        timestamp = /** @type {os.time.TimeInstant} */ (value).getStart();
      } catch (e) {
        // didn't work - try Date
        try {
          timestamp = /** @type {Date} */ (value).getTime();
        } catch (e) {
        }
      }
    } else if (goog.isString(value)) {
      value = moment(value).valueOf();
      if (!isNaN(value)) {
        timestamp = value;
      }
    }
  }

  if (timestamp !== os.histo.DateBinMethod.MAGIC) {
    // avoid moment here if at all possible because moment.utc() is much slower than using native Date functions. it's
    // less impactful in getBinLabel because that is only called once per bin
    var d = new Date(/** @type {Object|number|string|null|undefined} */ (timestamp + os.time.timeOffset));

    switch (this.binType_) {
      case os.histo.DateBinType.HOUR_OF_DAY:
        // 0-23
        return d.getUTCHours();
      case os.histo.DateBinType.HOUR_OF_WEEK:
        // 0 (Sunday) - 6 (Saturday) * 24 plus 0-23
        return d.getUTCDay() * 24 + d.getUTCHours();
      case os.histo.DateBinType.HOUR_OF_MONTH:
        // 1 - [28-31] (end of month) * 24 plus 0-23
        return d.getUTCDate() * 24 + d.getUTCHours();
      case os.histo.DateBinType.HOUR_OF_YEAR:
        // 1 - [365,366] (end of year) * 24 plus 0-23
        var onejan = os.time.floor(d, 'year');
        return Math.floor((d - onejan) / 86400000) * 24 + d.getUTCHours();
      case os.histo.DateBinType.DAY_OF_WEEK:
        // 0 (Sunday) - 6 (Saturday)
        return d.getUTCDay();
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
 * @inheritDoc
 */
os.histo.DateBinMethod.prototype.getBinKey = function(value) {
  return Number(value);
};


/**
 * @inheritDoc
 */
os.histo.DateBinMethod.prototype.getBinLabel = function(item) {
  var value = this.getValue(item);
  return this.getLabelForKey(/** @type {number|string} */ (value));
};


/**
 * @inheritDoc
 */
os.histo.DateBinMethod.prototype.getLabelForKey = function(value) {
  if (goog.isDef(value) && value != os.histo.DateBinMethod.MAGIC) {
    switch (this.binType_) {
      case os.histo.DateBinType.HOUR_OF_DAY:
        // value is 0-23, so pad to 0000-2300
        return goog.string.padNumber(/** @type {number} */ (value), 2) + '00';
      case os.histo.DateBinType.DAY_OF_WEEK:
        // convert from 0-6 to Sunday-Saturday
        return moment().isoWeekday(/** @type {number} */ (value)).format('dddd');
      case os.histo.DateBinType.MINUTE:
        return moment.utc(/** @type {number} */ (value)).format('YYYY-MM-DD HH:mm');
      case os.histo.DateBinType.HOUR:
        return moment.utc(/** @type {number} */ (value)).format('YYYY-MM-DD HH');
      case os.histo.DateBinType.DAY:
        return moment.utc(/** @type {number} */ (value)).format('YYYY-MM-DD');
      case os.histo.DateBinType.WEEK:
        return moment.utc(/** @type {number} */ (value)).day(0).format('YYYY-MM-DD');
      case os.histo.DateBinType.MONTH:
        return moment.utc(/** @type {number} */ (value)).format('YYYY-MM');
      case os.histo.DateBinType.YEAR:
        return moment.utc(/** @type {number} */ (value)).format('YYYY');
      case os.histo.DateBinType.HOUR_OF_WEEK:
      case os.histo.DateBinType.HOUR_OF_MONTH:
      case os.histo.DateBinType.HOUR_OF_YEAR:
        return value.toString();
      default:
        return os.time.toOffsetString(/** @type {number} */ (value));
    }
  }

  return os.histo.DateBinMethod.INVALID_DATE;
};


/**
 * TODO: Implement this if pivot tables are ever needed
 * @inheritDoc
 */
os.histo.DateBinMethod.prototype.filterDimension = goog.abstractMethod;


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

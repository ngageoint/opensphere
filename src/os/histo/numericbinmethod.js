goog.provide('os.histo.NumericBinMethod');

goog.require('goog.iter');
goog.require('goog.math.Range');
goog.require('goog.math.RangeSet');
goog.require('goog.string');
goog.require('os.histo.FilterComponent');
goog.require('os.histo.UniqueBinMethod');
goog.require('os.time.TimeInstant');



/**
 * @constructor
 * @extends {os.histo.UniqueBinMethod<T,number>}
 * @template T
 */
os.histo.NumericBinMethod = function() {
  os.histo.NumericBinMethod.base(this, 'constructor');
  this.type = 'Numeric';

  /**
   * @type {number}
   * @protected
   */
  this.width = 10;

  /**
   * @type {number}
   * @protected
   */
  this.offset = 0;

  /**
   * @type {number}
   * @protected
   */
  this.precision = 0;
};
goog.inherits(os.histo.NumericBinMethod, os.histo.UniqueBinMethod);


/**
 * "Unique" value used when a requested value is null or undefined. Crossfilter fails when values cannot be
 * directly compared, or when comparing mixed strings/numbers so this is used as a fallback number.
 *
 * Note: This number is intentionally larger than os.histo.NumericBinMethod.MAGIC_NAN for sorting purposes.
 *
 * @type {number}
 * @const
 */
os.histo.NumericBinMethod.MAGIC_EMPTY = 999999999999999998;


/**
 * "Unique" value used when a requested value cannot be coerced to a number. Crossfilter fails when values cannot be
 * directly compared, or when comparing mixed strings/numbers so this is used as a fallback number.
 *
 * @type {number}
 * @const
 */
os.histo.NumericBinMethod.MAGIC_NAN = 9999999998;


/**
 * Label displayed when the value cannot be coerced to a number.
 *
 * @type {string}
 * @const
 */
os.histo.NumericBinMethod.NAN_LABEL = 'Not a Number';


/**
 * @inheritDoc
 */
os.histo.NumericBinMethod.prototype.getValue = function(item) {
  var value = this.valueFunction ? this.valueFunction(item, this.field) : item[this.field];
  var num = NaN;

  var type = typeof value;
  if (value == null) {
    num = os.histo.NumericBinMethod.MAGIC_EMPTY;
  } else if (type == 'number') {
    num = value;
  } else if (value instanceof Date) {
    num = /** @type {Date} */ (value).getTime();
  } else if (value instanceof os.time.TimeInstant) {
    num = /** @type {os.time.TimeInstant} */ (value).getStart();
  } else if (type == 'string') {
    value = value.trim();
    // treat empty strings as an empty value, not NaN
    num = value ? goog.string.toNumber(value) : os.histo.NumericBinMethod.MAGIC_EMPTY;
  }

  // this should *always* return a number or crossfilter will have issues
  return !isNaN(num) ? num : os.histo.NumericBinMethod.MAGIC_NAN;
};


/**
 * @return {number} The width
 */
os.histo.NumericBinMethod.prototype.getWidth = function() {
  return this.width;
};


/**
 * @param {number} width
 */
os.histo.NumericBinMethod.prototype.setWidth = function(width) {
  this.width = width;
  this.precision = Math.max(
      os.histo.NumericBinMethod.getPrecision(this.getWidth()),
      os.histo.NumericBinMethod.getPrecision(this.getOffset()));
};


/**
 * @return {number} The offset
 */
os.histo.NumericBinMethod.prototype.getOffset = function() {
  return this.offset;
};


/**
 * @param {number} offset
 */
os.histo.NumericBinMethod.prototype.setOffset = function(offset) {
  this.offset = offset;
  this.precision = Math.max(
      os.histo.NumericBinMethod.getPrecision(this.getWidth()),
      os.histo.NumericBinMethod.getPrecision(this.getOffset()));
};


/**
 * @return {number} precision
 */
os.histo.NumericBinMethod.prototype.getPrecision = function() {
  return this.precision;
};


/**
 * @inheritDoc
 */
os.histo.NumericBinMethod.prototype.getBinKey = function(value) {
  if (typeof value == 'string') {
    value = value.trim();
    // treat empty strings as an empty value, not NaN
    value = value ? goog.string.toNumber(value) : os.histo.NumericBinMethod.MAGIC_EMPTY;
  }

  if (value === os.histo.NumericBinMethod.MAGIC_EMPTY || value === os.histo.NumericBinMethod.MAGIC_NAN) {
    return value;
  } else if (value === this.getFloor(os.histo.NumericBinMethod.MAGIC_EMPTY)) {
    return os.histo.NumericBinMethod.MAGIC_EMPTY;
  } else if (value === this.getFloor(os.histo.NumericBinMethod.MAGIC_NAN)) {
    return os.histo.NumericBinMethod.MAGIC_NAN;
  } else if (goog.isNumber(value)) {
    // not our magic number, so go ahead and floor it based on the method settings
    return this.getFloor(value);
  }

  // otherwise return the magic "not a number" value to keep crossfilter happy
  return os.histo.NumericBinMethod.MAGIC_NAN;
};


/**
 * @inheritDoc
 */
os.histo.NumericBinMethod.prototype.getBinLabel = function(item) {
  var key = this.getBinKey(this.getValue(item));
  return this.getLabelForKey(key);
};


/**
 * @inheritDoc
 */
os.histo.NumericBinMethod.prototype.getLabelForKey = function(key) {
  var width = this.getWidth();
  var precision = this.getPrecision();

  if (key === os.histo.NumericBinMethod.MAGIC_EMPTY) {
    // value is empty
    return 'No ' + this.field;
  } else if (key === os.histo.NumericBinMethod.MAGIC_NAN || typeof key != 'number') {
    // value cannot be coerced to a number
    return os.histo.NumericBinMethod.NAN_LABEL;
  } else {
    // the key should be a number, so if it's not a magic value return the bin range
    return key.toFixed(precision) + ' to ' + (key + width).toFixed(precision);
  }
};


/**
 * @inheritDoc
 */
os.histo.NumericBinMethod.prototype.filterDimension = function(dimension, item) {
  var value = this.getValue(item);
  var start = this.getBinKey(value);
  var width = this.getWidth();
  dimension.filterRange([start, start + width]);
};


/**
 * Gets the floored value of a number
 * @param {number} value
 * @return {number}
 */
os.histo.NumericBinMethod.prototype.getFloor = function(value) {
  var width = this.getWidth();
  var offset = this.getOffset();
  return Math.floor((value - offset) / width) * width + offset;
};


/**
 * Gets the precision of a number
 * @param {number} num
 * @return {number} precision
 */
os.histo.NumericBinMethod.getPrecision = function(num) {
  var s = num.toFixed(14);
  var i = s.indexOf('.');

  if (i > -1) {
    s = s.substring(i + 1);

    // replace trailing zeros
    s = s.replace(/0+$/, '');
    return s.length;
  }

  return 0;
};


/**
 * @inheritDoc
 */
os.histo.NumericBinMethod.prototype.persist = function(opt_to) {
  opt_to = os.histo.NumericBinMethod.base(this, 'persist', opt_to) || {};

  opt_to['width'] = this.getWidth();
  opt_to['offset'] = this.getOffset();

  return opt_to;
};


/**
 * @inheritDoc
 */
os.histo.NumericBinMethod.prototype.restore = function(config) {
  os.histo.NumericBinMethod.base(this, 'restore', config);

  var width = /** @type {string|number|undefined} */ (config['width']);
  if (width != null && !isNaN(width)) {
    this.setWidth(Number(width));
  }

  var offset = /** @type {string|number|undefined} */ (config['offset']);
  if (offset != null && !isNaN(offset)) {
    this.setOffset(Number(offset));
  }
};


/**
 * @inheritDoc
 */
os.histo.NumericBinMethod.prototype.getSortLabelFnAsc = function() {
  return os.histo.bin.sortByKey;
};


/**
 * @inheritDoc
 */
os.histo.NumericBinMethod.prototype.getSortLabelFnDesc = function() {
  return os.histo.bin.sortByKeyDesc;
};


/**
 * @inheritDoc
 */
os.histo.NumericBinMethod.prototype.createFilter = function(values) {
  return os.histo.NumericBinMethod.contains.bind(this, values);
};


/**
 * @inheritDoc
 */
os.histo.NumericBinMethod.prototype.exportAsFilter = function(bins) {
  var ranges = new goog.math.RangeSet();
  var filter = [];

  for (var i = 0; i < bins.length; i++) {
    var bin = bins[i];
    if (bin) {
      var key = /** @type {number} */ (bin.getKey());
      if (key === os.histo.NumericBinMethod.MAGIC_EMPTY) {
        // "no value" should be included, NaN should not
        filter.push(os.histo.FilterComponent.IS_EMPTY_HEAD + this.field + os.histo.FilterComponent.IS_EMPTY_TAIL);
      } else if (key !== os.histo.NumericBinMethod.MAGIC_NAN) {
        // merge overlapping ranges to reduce the filter size
        ranges.add(new goog.math.Range(key, key + this.width));
      }
    }
  }

  if (filter.length > 0 || !ranges.isEmpty()) {
    // add the merged ranges
    goog.iter.forEach(ranges, function(range) {
      filter.push(this.getFilterForRange_(range));
    }, this);
  }

  // if multiple filters were added, wrap in an Or block
  if (filter.length > 1) {
    filter.unshift('<Or>');
    filter.push('</Or>');
  }

  return filter.join('');
};


/**
 * @param {goog.math.Range} range
 * @return {string}
 * @private
 */
os.histo.NumericBinMethod.prototype.getFilterForRange_ = function(range) {
  var filter = ['<And hint="between">'];

  // add the lower bound
  filter.push(os.histo.FilterComponent.GT_HEAD);
  filter.push(this.field);
  filter.push(os.histo.FilterComponent.GT_MID);
  filter.push(range.start);
  filter.push(os.histo.FilterComponent.GT_TAIL);

  // add the upper bound
  filter.push(os.histo.FilterComponent.LT_HEAD);
  filter.push(this.field);
  filter.push(os.histo.FilterComponent.LT_MID);
  filter.push(range.end);
  filter.push(os.histo.FilterComponent.LT_TAIL);

  filter.push('</And>');
  return filter.join('');
};


/**
 * Test if a value is between or equal to the bin method's range for a set of minimum values.
 * @param {!Array<number>} values The values to check
 * @param {number} value The value to test
 * @return {boolean}
 *
 * @this os.histo.NumericBinMethod
 */
os.histo.NumericBinMethod.contains = function(values, value) {
  for (var i = 0; i < values.length; i++) {
    // check if the value is
    if (value >= values[i] && value <= values[i] + this.width) {
      return true;
    }
  }

  return false;
};

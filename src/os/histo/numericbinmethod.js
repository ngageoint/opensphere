goog.module('os.histo.NumericBinMethod');

const iter = goog.require('goog.iter');
const Range = goog.require('goog.math.Range');
const RangeSet = goog.require('goog.math.RangeSet');
const {toNumber} = goog.require('goog.string');
const DataModel = goog.require('os.data.xf.DataModel');
const FilterComponent = goog.require('os.histo.FilterComponent');
const UniqueBinMethod = goog.require('os.histo.UniqueBinMethod');
const {MAGIC_EMPTY, MAGIC_NAN, sortByKey, sortByKeyDesc} = goog.require('os.histo.bin');
const TimeInstant = goog.require('os.time.TimeInstant');


/**
 * @extends {UniqueBinMethod<T,number>}
 * @template T
 */
class NumericBinMethod extends UniqueBinMethod {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.type = NumericBinMethod.TYPE;

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

    /**
     * The minimum value, everything below this value will be grouped to the same bin
     * @type {number}
     * @protected
     */
    this.min = -MAGIC_EMPTY;

    /**
     * The maximum value, everything above this value will be grouped to the same bin
     * @type {number}
     * @protected
     */
    this.max = MAGIC_EMPTY;
  }

  /**
   * @inheritDoc
   */
  getValue(item) {
    var value = this.valueFunction ? this.valueFunction(item, this.field) : item[this.field];
    var num = NaN;

    var type = typeof value;
    if (value == null) {
      num = MAGIC_EMPTY;
    } else if (type == 'number') {
      num = value;
    } else if (value instanceof Date) {
      num = /** @type {Date} */ (value).getTime();
    } else if (value instanceof TimeInstant) {
      num = /** @type {TimeInstant} */ (value).getStart();
    } else if (type == 'string') {
      value = value.trim();
      // treat empty strings as an empty value, not NaN
      num = value ? toNumber(value) : MAGIC_EMPTY;
    }

    // this should *always* return a number or crossfilter will have issues
    return !isNaN(num) ? num : MAGIC_NAN;
  }

  /**
   * @return {number} The min
   */
  getMin() {
    return this.min;
  }

  /**
   * @param {number} min
   */
  setMin(min) {
    this.min = min;
  }

  /**
   * @return {number} The max
   */
  getMax() {
    return this.max;
  }

  /**
   * @param {number} max
   */
  setMax(max) {
    this.max = max;
  }

  /**
   * @return {number} The width
   */
  getWidth() {
    return this.width;
  }

  /**
   * @param {number} width
   */
  setWidth(width) {
    this.width = width;
    this.precision = Math.max(
        NumericBinMethod.getPrecision(this.width),
        NumericBinMethod.getPrecision(this.offset));
  }

  /**
   * @return {number} The offset
   */
  getOffset() {
    return this.offset;
  }

  /**
   * @param {number} offset
   */
  setOffset(offset) {
    this.offset = offset;
    this.precision = Math.max(
        NumericBinMethod.getPrecision(this.width),
        NumericBinMethod.getPrecision(this.offset));
  }

  /**
   * @return {number} precision
   */
  getPrecision() {
    return this.precision;
  }

  /**
   * @inheritDoc
   */
  getBinKey(value) {
    if (typeof value == 'string') {
      value = value.trim();
      // treat empty strings as an empty value, not NaN
      value = value ? toNumber(value) : MAGIC_EMPTY;
    }

    if (value === MAGIC_EMPTY || value === MAGIC_NAN) {
      return value;
    } else if (value === this.getFloor(MAGIC_EMPTY)) {
      return MAGIC_EMPTY;
    } else if (value === this.getFloor(MAGIC_NAN)) {
      return MAGIC_NAN;
    } else if (/** @type {number} */ (value) <= this.getFloor(this.min)) {
      return this.min;
    } else if (/** @type {number} */ (value) >= this.getFloor(this.max)) {
      return this.max;
    } else if (typeof value === 'number') {
      // not our magic number, so go ahead and floor it based on the method settings
      return this.getFloor(value);
    }

    // otherwise return the magic "not a number" value to keep crossfilter happy
    return MAGIC_NAN;
  }

  /**
   * @inheritDoc
   */
  getBinLabel(item) {
    var key = this.getBinKey(this.getValue(item));
    return this.getLabelForKey(key);
  }

  /**
   * @inheritDoc
   */
  getLabelForKey(key, opt_secondary, opt_smallLabel) {
    if (typeof key === 'string' && key.indexOf(DataModel.SEPARATOR) >= 0) {
      // this key is in a bin that represents the intersection of two values; split them apart with the separator
      key = !opt_secondary ? Number(key.split(DataModel.SEPARATOR)[0]) :
        Number(key.split(DataModel.SEPARATOR)[1]);
    }

    var width = this.width;
    var precision = this.precision;

    if (key === MAGIC_EMPTY) {
      // value is empty
      return 'No ' + this.field;
    } else if (key === MAGIC_NAN || typeof key != 'number') {
      // value cannot be coerced to a number
      return NumericBinMethod.NAN_LABEL;
    } else {
      // the key should be a number, so if it's not a magic value return the bin range
      return !opt_smallLabel ? key.toFixed(precision) + NumericBinMethod.LABEL_RANGE_SEP +
      (key + width).toFixed(precision) : key.toFixed(precision);
    }
  }

  /**
   * @inheritDoc
   */
  filterDimension(dimension, item) {
    var value = this.getValue(item);
    var start = this.getBinKey(value);
    var width = this.width;
    dimension.filterRange([start, start + width]);
  }

  /**
   * Gets the floored value of a number
   *
   * @param {number} value
   * @return {number}
   */
  getFloor(value) {
    var width = this.width;
    var offset = this.offset;
    return Math.floor((value - offset) / width) * width + offset;
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    opt_to = super.persist(opt_to) || {};

    opt_to['width'] = this.width;
    opt_to['offset'] = this.offset;
    opt_to['min'] = this.min;
    opt_to['max'] = this.max;

    return opt_to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    super.restore(config);

    var width = /** @type {string|number|undefined} */ (config['width']);
    if (width != null && !isNaN(width)) {
      this.setWidth(Number(width));
    }

    var offset = /** @type {string|number|undefined} */ (config['offset']);
    if (offset != null && !isNaN(offset)) {
      this.setOffset(Number(offset));
    }

    var min = /** @type {string|number|undefined} */ (config['min']);
    if (min != null && !isNaN(min)) {
      this.setMin(Number(min));
    }

    var max = /** @type {string|number|undefined} */ (config['max']);
    if (max != null && !isNaN(max)) {
      this.setMax(Number(max));
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
  createFilter(values) {
    return NumericBinMethod.numericContains.bind(this, values);
  }

  /**
   * @inheritDoc
   */
  exportAsFilter(bins) {
    var ranges = new RangeSet();
    var filter = [];

    for (var i = 0; i < bins.length; i++) {
      var bin = bins[i];
      if (bin) {
        var key = /** @type {number} */ (bin.getKey());
        if (key === MAGIC_EMPTY) {
          // "no value" should be included, NaN should not
          filter.push(FilterComponent.IS_EMPTY_HEAD + this.field + FilterComponent.IS_EMPTY_TAIL);
        } else if (key !== MAGIC_NAN) {
          // merge overlapping ranges to reduce the filter size
          ranges.add(new Range(key, key + this.width));
        }
      }
    }

    if (filter.length > 0 || !ranges.isEmpty()) {
      // add the merged ranges
      iter.forEach(ranges, function(range) {
        filter.push(this.getFilterForRange_(range));
      }, this);
    }

    // if multiple filters were added, wrap in an Or block
    if (filter.length > 1) {
      filter.unshift('<Or>');
      filter.push('</Or>');
    }

    return filter.join('');
  }

  /**
   * @param {Range} range
   * @return {string}
   * @private
   */
  getFilterForRange_(range) {
    var filter = ['<And hint="between">'];

    // add the lower bound
    filter.push(FilterComponent.GT_HEAD);
    filter.push(this.field);
    filter.push(FilterComponent.GT_MID);
    filter.push(range.start);
    filter.push(FilterComponent.GT_TAIL);

    // add the upper bound
    filter.push(FilterComponent.LT_HEAD);
    filter.push(this.field);
    filter.push(FilterComponent.LT_MID);
    filter.push(range.end);
    filter.push(FilterComponent.LT_TAIL);

    filter.push('</And>');
    return filter.join('');
  }

  /**
   * @inheritDoc
   */
  getStatsForBin(bins) {
    var result = super.getStatsForBin(bins);
    if (result != null) {
      result.step = this.getWidth() || 1; // don't allow divide by 0 errors
      result.binCountAll = ((result.range[1] - result.range[0]) / result.step) + 1;
    }
    return result;
  }

  /**
   * Gets the precision of a number
   *
   * @param {number} num
   * @return {number} precision
   */
  static getPrecision(num) {
    var s = num.toFixed(14);
    var i = s.indexOf('.');

    if (i > -1) {
      s = s.substring(i + 1);

      // replace trailing zeros
      s = s.replace(/0+$/, '');
      return s.length;
    }

    return 0;
  }

  /**
   * Test if a value is between or equal to the bin method's range for a set of minimum values.
   *
   * @param {!Array<number>} values The values to check
   * @param {number} value The value to test
   * @return {boolean}
   *
   * @this NumericBinMethod
   */
  static numericContains(values, value) {
    for (var i = 0; i < values.length; i++) {
      // check if the value is
      if (value >= values[i] && value <= values[i] + this.width) {
        return true;
      }
    }

    return false;
  }
}

/**
 * @type {string}
 * @override
 */
NumericBinMethod.TYPE = 'Numeric';

/**
 * "Unique" value used when a requested value is null or undefined. Crossfilter fails when values cannot be
 * directly compared, or when comparing mixed strings/numbers so this is used as a fallback number.
 *
 * Note: This number is intentionally larger than os.histo.NumericBinMethod.MAGIC_NAN for sorting purposes.
 *
 * @type {number}
 * @const
 * @deprecated Please use os.histo.bin.MAGIC_EMPTY instead.
 */
NumericBinMethod.MAGIC_EMPTY = MAGIC_EMPTY;

/**
 * "Unique" value used when a requested value cannot be coerced to a number. Crossfilter fails when values cannot be
 * directly compared, or when comparing mixed strings/numbers so this is used as a fallback number.
 *
 * @type {number}
 * @const
 * @deprecated Please use os.histo.bin.MAGIC_NAN instead.
 */
NumericBinMethod.MAGIC_NAN = MAGIC_NAN;

/**
 * Label displayed when the value cannot be coerced to a number.
 *
 * @type {string}
 * @const
 */
NumericBinMethod.NAN_LABEL = 'Not a Number';

/**
 * String the separates in range based labels
 *
 * @type {string}
 * @const
 */
NumericBinMethod.LABEL_RANGE_SEP = ' to ';

exports = NumericBinMethod;

goog.module('os.histo.UniqueBinMethod');
goog.module.declareLegacyNamespace();

const DataModel = goog.require('os.data.xf.DataModel');
const FilterComponent = goog.require('os.histo.FilterComponent');
const IBinMethod = goog.require('os.histo.IBinMethod'); // eslint-disable-line
const {
  MAGIC_EMPTY,
  sortByLabel,
  sortByLabelDesc,
  sortByCount,
  sortByCountDesc
} = goog.require('os.histo.bin');
const {STRING_VAL} = goog.require('os.object');

const IPersistable = goog.requireType('os.IPersistable');
const Bin = goog.requireType('os.histo.Bin');
const BinMethodStats = goog.requireType('os.histo.BinMethodStats');


/**
 * @implements {IBinMethod<T,S>}
 * @implements {IPersistable}
 * @template T,S
 */
class UniqueBinMethod {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {string}
     * @protected
     */
    this.field = '';

    /**
     * @type {string}
     * @protected
     */
    this.type = UniqueBinMethod.TYPE;

    /**
     * @type {?function(T, string):*}
     * @protected
     */
    this.valueFunction = null;

    /**
     * @type {boolean}
     * @protected
     */
    this.arrayKeys = false;

    /**
     * The items processed by this bin method should be considered dates
     * @type {boolean}
     * @protected
     */
    this.isDate = false;

    /**
     * The graph(s) using this BinMethod instance should show the bins with count = 0
     * @type {boolean}
     * @protected
     */
    this.showEmptyBins = false;

    /**
     * Cap the amount of resources used by the crossfilter
     * @type {number}
     * @protected
     */
    this.maxBins = Infinity;
  }

  /**
   * @inheritDoc
   */
  getValue(item) {
    // crossfilter bonks if you give it null/undefined values, or when comparing mixed strings/numbers. for the unique
    // bin method, always return a string. for null/undefined, the string is set to 'No <field>' so it can be returned
    // directly as the bin key used for grouping.
    //
    // performance note: I avoided function calls here because this gets called a *lot* and function calls are
    // comparatively expensive to performing checks directly.

    var value = this.valueFunction ? this.valueFunction(item, this.field) : item[this.field];
    if (value != null) {
      // has a value, so make sure it's a string for crossfilter's sake
      value = value.toString();

      // don't display objects lacking a toString override
      if (value === STRING_VAL) {
        return UniqueBinMethod.INVALID_VALUE;
      }

      // but only return the value if it isn't an empty string
      if (value.length > 0) {
        return value;
      }
    }

    // no/empty value
    return 'No ' + this.field;
  }

  /**
   * @inheritDoc
   */
  getField() {
    return this.field;
  }

  /**
   * @inheritDoc
   */
  setField(field) {
    this.field = field;
  }

  /**
   * @inheritDoc
   */
  getValueFunction() {
    return this.valueFunction;
  }

  /**
   * @inheritDoc
   */
  setValueFunction(func) {
    this.valueFunction = func;
  }

  /**
   * @inheritDoc
   */
  getBinKey(value) {
    return value.toString();
  }

  /**
   * @inheritDoc
   */
  getBinLabel(item) {
    return this.getBinKey(this.getValue(item)).toString();
  }

  /**
   * @inheritDoc
   */
  getLabelForKey(key, opt_secondary, opt_smallLabel) {
    if (typeof key === 'string' && key.indexOf(DataModel.SEPARATOR) >= 0) {
      // this key is in a bin that represents the intersection of two values; split them apart with the separator
      key = !opt_secondary ? key.split(DataModel.SEPARATOR)[0] :
        key.split(DataModel.SEPARATOR)[1];
    }

    if (Number(key) === MAGIC_EMPTY) {
      return opt_smallLabel ? '-NONE-' : 'No ' + this.field;
    }

    return key.toString();
  }

  /**
   * @inheritDoc
   */
  getBinType() {
    return this.type;
  }

  /**
   * @inheritDoc
   */
  filterDimension(dimension, item) {
    var value = this.getValue(item);
    var key = this.getBinKey(value);
    dimension.filterExact(key);
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    if (!opt_to) {
      opt_to = {};
    }

    opt_to['type'] = this.getBinType();
    opt_to['field'] = this.getField();
    opt_to['isDate'] = this.getIsDate();
    opt_to['arrayKeys'] = this.getArrayKeys();
    opt_to['showEmptyBins'] = this.getShowEmptyBins();
    opt_to['maxBins'] = this.getMaxBins();

    return opt_to;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    var field = /** @type {string|undefined} */ (config['field']);
    if (typeof field === 'string') {
      this.setField(field);
    }
    var isDate = /** @type {boolean} */ (config['isDate']);
    this.setIsDate(isDate);

    var arrayKeys = /** @type {boolean|string|undefined} */ (config['arrayKeys']);
    if (typeof arrayKeys === 'boolean' || typeof arrayKeys === 'string') {
      this.setArrayKeys(arrayKeys);
    }

    var show = /** @type {string|boolean|undefined} */ (config['showEmptyBins']);
    if (show != null) {
      this.setShowEmptyBins(show == true); // loose comparison rather than ===
    }

    var maxBins = /** @type {string|number|undefined} */ (config['maxBins']);
    if (maxBins != null && !isNaN(maxBins)) {
      this.setMaxBins(Number(maxBins));
    }
  }

  /**
   * Clones the bin method.
   *
   * @return {os.histo.UniqueBinMethod}
   */
  clone() {
    var clone = new this.constructor();
    clone.restore(this.persist());
    clone.setValueFunction(this.valueFunction);
    return clone;
  }

  /**
   * @inheritDoc
   */
  getSortLabelFnAsc() {
    return sortByLabel;
  }

  /**
   * @inheritDoc
   */
  getSortLabelFnDesc() {
    return sortByLabelDesc;
  }

  /**
   * @inheritDoc
   */
  getSortCountFnAsc() {
    return sortByCount;
  }

  /**
   * @inheritDoc
   */
  getSortCountFnDesc() {
    return sortByCountDesc;
  }

  /**
   * @inheritDoc
   */
  createFilter(values) {
    return UniqueBinMethod.uniqueContains.bind(this, values);
  }

  /**
   * @inheritDoc
   */
  exportAsFilter(bins) {
    var filter = [];

    var emptyKey = 'No ' + this.field;
    for (var i = 0; i < bins.length; i++) {
      var bin = bins[i];
      if (bin) {
        if (bin.getKey() == emptyKey) {
          filter.push(FilterComponent.IS_EMPTY_HEAD + this.field + FilterComponent.IS_EMPTY_TAIL);
        } else if (bin.getKey() != UniqueBinMethod.INVALID_VALUE) {
          filter.push(this.getFilterForBin(bin));
        }
      }
    }

    // if multiple filters were added, wrap in an Or block
    if (filter.length > 1) {
      filter.unshift('<Or>');
      filter.push('</Or>');
    }

    return filter.join('');
  }

  /**
   * @inheritDoc
   */
  getArrayKeys() {
    return this.arrayKeys;
  }

  /**
   * @inheritDoc
   */
  setArrayKeys(value) {
    if (typeof value === 'string') {
      value = Boolean(value);
    }
    this.arrayKeys = value;
  }

  /**
   * @inheritDoc
   */
  getIsDate() {
    return this.isDate;
  }

  /**
   * @inheritDoc
   */
  setIsDate(value) {
    this.isDate = value;
  }

  /**
   * Gets the showEmptyBins property
   * @return {boolean} true if the empty bins should be displayed by the graphing system
   */
  getShowEmptyBins() {
    return this.showEmptyBins;
  }

  /**
   * Sets the showEmptyBins property
   * @param {boolean} value toggle to show/hide the empty bins
   */
  setShowEmptyBins(value) {
    this.showEmptyBins = value;
  }

  /**
   * Gets the maxBins property
   * @return {number}
   */
  getMaxBins() {
    return this.maxBins;
  }

  /**
   * Sets the maxBins property
   * @param {number} value
   */
  setMaxBins(value) {
    this.maxBins = value;
  }

  /**
   * Get the filter for an individual bin.
   *
   * @param {!Bin} bin The bin
   * @return {string} The filter
   * @protected
   */
  getFilterForBin(bin) {
    var filter = [];
    filter.push(FilterComponent.IS_EQUAL_HEAD);
    filter.push(this.field);
    filter.push(FilterComponent.IS_EQUAL_MID);
    filter.push(bin.getLabel());
    filter.push(FilterComponent.IS_EQUAL_TAIL);
    return filter.join('');
  }

  /**
   * Get the range, step size, etc for the bins made by this method.
   *
   * @param {!Array<Bin>} bins The bins made using this bin method
   * @return {BinMethodStats|null} The config
   */
  getStatsForBin(bins) {
    if (!bins || bins.length == 0) return null;
    var range = [bins[0]['key'], bins[bins.length - 1]['key']];
    var step = 1; // don't allow divide by 0 errors
    return /** @type {BinMethodStats} */ ({
      range: range,
      step: step,
      binCount: bins.length,
      binCountAll: ((range[1] - range[0]) / step) + 1 // +1 since it needs a bin for the top and bottom entry
    });
  }

  /**
   * Test if a value is contained within a set of values. Avoided ol.array.includes to prevent an extra function call.
   *
   * @param {!Array<string>} values
   * @param {string} value
   * @return {boolean}
   *
   * @this os.histo.UniqueBinMethod
   */
  static uniqueContains(values, value) {
    return !!values && values.indexOf(value) >= 0;
  }
}

/**
 * @type {string}
 */
UniqueBinMethod.TYPE = 'Unique';

/**
 * String to use when an object is complex and cannot be used.
 * @type {string}
 * @const
 */
UniqueBinMethod.INVALID_VALUE = 'Invalid Value';

exports = UniqueBinMethod;

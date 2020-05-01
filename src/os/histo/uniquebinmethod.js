goog.provide('os.histo.BinMethodStats');
goog.provide('os.histo.UniqueBinMethod');

goog.require('os.IPersistable');
goog.require('os.histo.FilterComponent');
goog.require('os.histo.IBinMethod');
goog.require('os.histo.bin');
goog.require('os.object');



/**
 * A function used to sort features.
 * @typedef {{
 *   range: Array<number>,
 *   step: number,
 *   binCount: number,
 *   binCountAll: number
 * }}
 */
os.histo.BinMethodStats;


/**
 * @constructor
 * @implements {os.histo.IBinMethod<T,S>}
 * @implements {os.IPersistable}
 * @template T,S
 */
os.histo.UniqueBinMethod = function() {
  /**
   * @type {string}
   * @protected
   */
  this.field = '';

  /**
   * @type {string}
   * @protected
   */
  this.type = os.histo.UniqueBinMethod.TYPE;

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
};


/**
 * @type {string}
 * @const
 */
os.histo.UniqueBinMethod.TYPE = 'Unique';


/**
 * String to use when an object is complex and cannot be used.
 * @type {string}
 * @const
 */
os.histo.UniqueBinMethod.INVALID_VALUE = 'Invalid Value';


/**
 * @inheritDoc
 */
os.histo.UniqueBinMethod.prototype.getValue = function(item) {
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
    if (value === os.object.STRING_VAL) {
      return os.histo.UniqueBinMethod.INVALID_VALUE;
    }

    // but only return the value if it isn't an empty string
    if (value.length > 0) {
      return value;
    }
  }

  // no/empty value
  return 'No ' + this.field;
};


/**
 * @inheritDoc
 */
os.histo.UniqueBinMethod.prototype.getField = function() {
  return this.field;
};


/**
 * @inheritDoc
 */
os.histo.UniqueBinMethod.prototype.setField = function(field) {
  this.field = field;
};


/**
 * @inheritDoc
 */
os.histo.UniqueBinMethod.prototype.getValueFunction = function() {
  return this.valueFunction;
};


/**
 * @inheritDoc
 */
os.histo.UniqueBinMethod.prototype.setValueFunction = function(func) {
  this.valueFunction = func;
};


/**
 * @inheritDoc
 */
os.histo.UniqueBinMethod.prototype.getBinKey = function(value) {
  return value.toString();
};


/**
 * @inheritDoc
 */
os.histo.UniqueBinMethod.prototype.getBinLabel = function(item) {
  return this.getBinKey(this.getValue(item)).toString();
};


/**
 * @inheritDoc
 */
os.histo.UniqueBinMethod.prototype.getLabelForKey = function(key, opt_secondary, opt_smallLabel) {
  if (typeof key === 'string' && key.indexOf(os.data.xf.DataModel.SEPARATOR) >= 0) {
    // this key is in a bin that represents the intersection of two values; split them apart with the separator
    key = !opt_secondary ? key.split(os.data.xf.DataModel.SEPARATOR)[0] :
      key.split(os.data.xf.DataModel.SEPARATOR)[1];
  }

  if (Number(key) === os.histo.NumericBinMethod.MAGIC_EMPTY) {
    return opt_smallLabel ? '-NONE-' : 'No ' + this.field;
  }

  return key.toString();
};


/**
 * @inheritDoc
 */
os.histo.UniqueBinMethod.prototype.getBinType = function() {
  return this.type;
};


/**
 * @inheritDoc
 */
os.histo.UniqueBinMethod.prototype.filterDimension = function(dimension, item) {
  var value = this.getValue(item);
  var key = this.getBinKey(value);
  dimension.filterExact(key);
};


/**
 * @inheritDoc
 */
os.histo.UniqueBinMethod.prototype.persist = function(opt_to) {
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
};


/**
 * @inheritDoc
 */
os.histo.UniqueBinMethod.prototype.restore = function(config) {
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
};


/**
 * Clones the bin method.
 *
 * @return {os.histo.UniqueBinMethod}
 */
os.histo.UniqueBinMethod.prototype.clone = function() {
  var clone = new this.constructor();
  clone.restore(this.persist());
  clone.setValueFunction(this.valueFunction);
  return clone;
};


/**
 * @inheritDoc
 */
os.histo.UniqueBinMethod.prototype.getSortLabelFnAsc = function() {
  return os.histo.bin.sortByLabel;
};


/**
 * @inheritDoc
 */
os.histo.UniqueBinMethod.prototype.getSortLabelFnDesc = function() {
  return os.histo.bin.sortByLabelDesc;
};


/**
 * @inheritDoc
 */
os.histo.UniqueBinMethod.prototype.getSortCountFnAsc = function() {
  return os.histo.bin.sortByCount;
};


/**
 * @inheritDoc
 */
os.histo.UniqueBinMethod.prototype.getSortCountFnDesc = function() {
  return os.histo.bin.sortByCountDesc;
};


/**
 * @inheritDoc
 */
os.histo.UniqueBinMethod.prototype.createFilter = function(values) {
  return os.histo.UniqueBinMethod.contains.bind(this, values);
};


/**
 * @inheritDoc
 */
os.histo.UniqueBinMethod.prototype.exportAsFilter = function(bins) {
  var filter = [];

  var emptyKey = 'No ' + this.field;
  for (var i = 0; i < bins.length; i++) {
    var bin = bins[i];
    if (bin) {
      if (bin.getKey() == emptyKey) {
        filter.push(os.histo.FilterComponent.IS_EMPTY_HEAD + this.field + os.histo.FilterComponent.IS_EMPTY_TAIL);
      } else if (bin.getKey() != os.histo.UniqueBinMethod.INVALID_VALUE) {
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
};


/**
 * @inheritDoc
 */
os.histo.UniqueBinMethod.prototype.getArrayKeys = function() {
  return this.arrayKeys;
};


/**
 * @inheritDoc
 */
os.histo.UniqueBinMethod.prototype.setArrayKeys = function(value) {
  if (typeof value === 'string') {
    value = Boolean(value);
  }
  this.arrayKeys = value;
};


/**
 * @inheritDoc
 */
os.histo.UniqueBinMethod.prototype.getIsDate = function() {
  return this.isDate;
};


/**
 * @inheritDoc
 */
os.histo.UniqueBinMethod.prototype.setIsDate = function(value) {
  this.isDate = value;
};


/**
 * Gets the showEmptyBins property
 * @return {boolean} true if the empty bins should be displayed by the graphing system
 */
os.histo.UniqueBinMethod.prototype.getShowEmptyBins = function() {
  return this.showEmptyBins;
};


/**
 * Sets the showEmptyBins property
 * @param {boolean} value toggle to show/hide the empty bins
 */
os.histo.UniqueBinMethod.prototype.setShowEmptyBins = function(value) {
  this.showEmptyBins = value;
};


/**
 * Gets the maxBins property
 * @return {number}
 */
os.histo.UniqueBinMethod.prototype.getMaxBins = function() {
  return this.maxBins;
};


/**
 * Sets the maxBins property
 * @param {number} value
 */
os.histo.UniqueBinMethod.prototype.setMaxBins = function(value) {
  this.maxBins = value;
};


/**
 * Get the filter for an individual bin.
 *
 * @param {!os.histo.Bin} bin The bin
 * @return {string} The filter
 * @protected
 */
os.histo.UniqueBinMethod.prototype.getFilterForBin = function(bin) {
  var filter = [];
  filter.push(os.histo.FilterComponent.IS_EQUAL_HEAD);
  filter.push(this.field);
  filter.push(os.histo.FilterComponent.IS_EQUAL_MID);
  filter.push(bin.getLabel());
  filter.push(os.histo.FilterComponent.IS_EQUAL_TAIL);
  return filter.join('');
};


/**
 * Get the range, step size, etc for the bins made by this method.
 *
 * @param {!Array<os.histo.Bin>} bins The bins made using this bin method
 * @return {os.histo.BinMethodStats|null} The config
 */
os.histo.UniqueBinMethod.prototype.getStatsForBin = function(bins) {
  if (!bins || bins.length == 0) return null;
  var range = [bins[0]['key'], bins[bins.length - 1]['key']];
  var step = 1; // don't allow divide by 0 errors
  return /** @type {os.histo.BinMethodStats} */ ({
    range: range,
    step: step,
    binCount: bins.length,
    binCountAll: ((range[1] - range[0]) / step) + 1 // +1 since it needs a bin for the top and bottom entry
  });
};

/**
 * Test if a value is contained within a set of values. Avoided ol.array.includes to prevent an extra function call.
 *
 * @param {!Array<string>} values
 * @param {string} value
 * @return {boolean}
 *
 * @this os.histo.UniqueBinMethod
 */
os.histo.UniqueBinMethod.contains = function(values, value) {
  return !!values && values.indexOf(value) >= 0;
};

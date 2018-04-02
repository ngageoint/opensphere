goog.provide('os.histo.UniqueBinMethod');

goog.require('os.IPersistable');
goog.require('os.histo.FilterComponent');
goog.require('os.histo.IBinMethod');
goog.require('os.histo.bin');
goog.require('os.object');



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
  this.type = 'Unique';

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
};


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
os.histo.UniqueBinMethod.prototype.getLabelForKey = function(key) {
  if (Number(key) === os.histo.NumericBinMethod.MAGIC_EMPTY) {
    return 'No ' + this.field;
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
};


/**
 * Clones the bin method.
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
os.histo.UniqueBinMethod.prototype.setArrayKeys = function(value) {
  this.arrayKeys = value;
};


/**
 * Get the filter for an individual bin.
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
 * Test if a value is contained within a set of values. Avoided goog.array.contains to prevent an extra function call.
 * @param {!Array<string>} values
 * @param {string} value
 * @return {boolean}
 *
 * @this os.histo.UniqueBinMethod
 */
os.histo.UniqueBinMethod.contains = function(values, value) {
  return !!values && values.indexOf(value) >= 0;
};

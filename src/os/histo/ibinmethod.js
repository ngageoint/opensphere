goog.module('os.histo.IBinMethod');
goog.module.declareLegacyNamespace();

const IPersistable = goog.requireType('os.IPersistable');
const Bin = goog.requireType('os.histo.Bin');

/**
 * @interface
 * @extends {IPersistable}
 * @template T,S
 */
class IBinMethod {
  /**
   * @param {T} item
   * @return {*} The value. Must be naturally ordered!
   */
  getValue(item) {}

  /**
   * @return {string}
   */
  getField() {}

  /**
   * @param {string} field
   */
  setField(field) {}

  /**
   * Gets the bin key for the given value
   * @param {*} value
   * @return {S}
   */
  getBinKey(value) {}

  /**
   * Gets the bin label for the given value
   * @param {T} item
   * @return {string}
   */
  getBinLabel(item) {}

  /**
   * Gets the bin label the given key.
   * @param {string|number} key
   * @param {boolean=} opt_secondary
   * @param {boolean=} opt_smallLabel
   * @return {string}
   */
  getLabelForKey(key, opt_secondary, opt_smallLabel) {}

  /**
   * Gets the bin type identifier
   * @return {string}
   */
  getBinType() {}

  /**
   * Gets the value accessor function
   * @return {?function(T, string):*}
   */
  getValueFunction() {}

  /**
   * Sets the value accessor function
   * @param {?function(T, string):*} func
   */
  setValueFunction(func) {}

  /**
   * Filters the given dimension to the bin range that contains the given item
   * @param {crossfilter.Dimension} dimension
   * @param {T} item
   */
  filterDimension(dimension, item) {}

  /**
   * Returns the sorting function for labels in ascending order
   * @return {function ((Bin|null), (Bin|null)): number}
   */
  getSortLabelFnAsc() {}

  /**
   * Returns the sorting function for labels in descending order
   * @return {function ((Bin|null), (Bin|null)): number}
   */
  getSortLabelFnDesc() {}

  /**
   * Returns the sorting function for counts in ascending order
   * @return {function ((Bin|null), (Bin|null)): number}
   */
  getSortCountFnAsc() {}

  /**
   * Returns the sorting function for counts in descending order
   * @return {function ((Bin|null), (Bin|null)): number}
   */
  getSortCountFnDesc() {}

  /**
   * Exports the bin method as an XML filter
   * @param {!Array<!Bin>} bins
   * @return {?string}
   */
  exportAsFilter(bins) {}

  /**
   * @param {!Array<S>} values
   * @return {function(S):boolean}
   */
  createFilter(values) {}

  /**
   * @return {boolean}
   */
  getArrayKeys() {}

  /**
   * @param {boolean|string} value
   */
  setArrayKeys(value) {}

  /**
   * @return {boolean}
   */
  getIsDate() {}

  /**
   * @param {boolean} value
   */
  setIsDate(value) {}
}

exports = IBinMethod;

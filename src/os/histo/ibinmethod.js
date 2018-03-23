goog.provide('os.histo.IBinMethod');

goog.require('os.IPersistable');



/**
 * @interface
 * @extends {os.IPersistable}
 * @template T,S
 */
os.histo.IBinMethod = function() {};


/**
 * @param {T} item
 * @return {*} The value. Must be naturally ordered!
 */
os.histo.IBinMethod.prototype.getValue;


/**
 * @return {string}
 */
os.histo.IBinMethod.prototype.getField = goog.abstractMethod;


/**
 * @param {string} field
 */
os.histo.IBinMethod.prototype.setField;


/**
 * Gets the bin key for the given value
 * @param {*} value
 * @return {S}
 */
os.histo.IBinMethod.prototype.getBinKey;


/**
 * Gets the bin label for the given value
 * @param {T} item
 * @return {string}
 */
os.histo.IBinMethod.prototype.getBinLabel;


/**
 * Gets the bin label the given key.
 * @param {string|number} item
 * @return {string}
 */
os.histo.IBinMethod.prototype.getLabelForKey;


/**
 * Gets the bin type identifier
 * @return {string}
 */
os.histo.IBinMethod.prototype.getBinType;


/**
 * Sets the value accessor function
 * @param {?function(T, string):*} func
 */
os.histo.IBinMethod.prototype.setValueFunction;


/**
 * Filters the given dimension to the bin range that contains the given item
 * @param {crossfilter.Dimension} dimension
 * @param {T} item
 */
os.histo.IBinMethod.prototype.filterDimension;


/**
 * Returns the sorting function for labels in ascending order
 * @return {function ((os.histo.Bin|null), (os.histo.Bin|null)): number}
 */
os.histo.IBinMethod.prototype.getSortLabelFnAsc;


/**
 * Returns the sorting function for labels in descending order
 * @return {function ((os.histo.Bin|null), (os.histo.Bin|null)): number}
 */
os.histo.IBinMethod.prototype.getSortLabelFnDesc;


/**
 * Returns the sorting function for counts in ascending order
 * @return {function ((os.histo.Bin|null), (os.histo.Bin|null)): number}
 */
os.histo.IBinMethod.prototype.getSortCountFnAsc;


/**
 * Returns the sorting function for counts in descending order
 * @return {function ((os.histo.Bin|null), (os.histo.Bin|null)): number}
 */
os.histo.IBinMethod.prototype.getSortCountFnDesc;


/**
 * Exports the bin method as an XML filter
 * @param {!Array<!os.histo.Bin>} bins
 * @return {?string}
 */
os.histo.IBinMethod.prototype.exportAsFilter;


/**
 * @param {!Array<S>} values
 * @return {function(S):boolean}
 */
os.histo.IBinMethod.prototype.createFilter;


/**
 * @param {boolean} value
 */
os.histo.IBinMethod.prototype.setArrayKeys;

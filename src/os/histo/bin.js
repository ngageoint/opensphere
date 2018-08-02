goog.provide('os.histo.Bin');
goog.provide('os.histo.bin');

goog.require('os.histo.Result');



/**
 * Represents a single bin in a histogram
 * @constructor
 * @template T
 */
os.histo.Bin = function() {
  /**
   * @type {string|number}
   * @private
   */
  this.key_ = '';

  /**
   * @type {string}
   * @private
   */
  this.label_ = '';

  /**
   * @type {?Array.<!os.histo.Result.<T>>}
   * @protected
   */
  this.children = null;

  /**
   * @type {Array.<T>}
   * @protected
   */
  this.items = [];

  /**
   * This is just so we can show bins in a slickgrid instance. It will be set by the label so when a bin is recreated
   * slickgrid will identify it as the same item for selection purposes.
   * @type {string}
   */
  this['id'] = '';
};


/**
 * Adds an item to the bin
 * @param {T} item
 */
os.histo.Bin.prototype.addItem = function(item) {
  this.items.push(item);
};


/**
 * Remove an item from the bin
 * @param {T} item
 */
os.histo.Bin.prototype.removeItem = function(item) {
  var i = this.items.indexOf(item);
  if (i > -1) {
    this.items.splice(i, 1);
  }
};


/**
 * Clears the bin
 */
os.histo.Bin.prototype.clear = function() {
  this.items.length = 0;
};


/**
 * Gets the count for the bin
 * @return {number}
 */
os.histo.Bin.prototype.getCount = function() {
  return this.items.length;
};


/**
 * Gets the items in the bin
 * @return {Array.<T>}
 */
os.histo.Bin.prototype.getItems = function() {
  return this.items;
};


/**
 * Gets the key
 * @return {string|number}
 */
os.histo.Bin.prototype.getKey = function() {
  return this.key_;
};


/**
 * Sets the key
 * @param {string|number} value
 */
os.histo.Bin.prototype.setKey = function(value) {
  this.key_ = value;
};


/**
 * Gets the label
 * @return {string}
 */
os.histo.Bin.prototype.getLabel = function() {
  return this.label_;
};


/**
 * Sets the label
 * @param {string} label
 */
os.histo.Bin.prototype.setLabel = function(label) {
  this.label_ = label;
  this['id'] = label;
};


/**
 * Gets the child bins
 * @return {?Array.<os.histo.Result.<T>>}
 */
os.histo.Bin.prototype.getChildren = function() {
  return this.children;
};


/**
 * Sets the child bins
 * @param {?Array.<!os.histo.Result.<T>>} children
 */
os.histo.Bin.prototype.setChildren = function(children) {
  this.children = children;
};


/**
 * Returns the id
 * @return {number} true if the bins have the same id's
 */
os.histo.Bin.prototype.getId = function() {
  return this['id'];
};


/**
 * @typedef {function(os.histo.Bin, os.histo.Bin):number}
 */
os.histo.bin.SortFn;


/**
 * Sorts bins by the number of items in the bin, in ascending order
 * @param {os.histo.Bin} a A bin
 * @param {os.histo.Bin} b Another bin
 * @return {number}
 */
os.histo.bin.sortByCount = function(a, b) {
  return goog.array.defaultCompare(a.getCount(), b.getCount());
};


/**
 * Sorts bins by the number of items in the bin, in descending order
 * @param {os.histo.Bin} a A bin
 * @param {os.histo.Bin} b Another bin
 * @return {number}
 */
os.histo.bin.sortByCountDesc = function(a, b) {
  return os.histo.bin.sortByCount(b, a);
};


/**
 * Sorts bins by key
 * @param {os.histo.Bin} a A bin
 * @param {os.histo.Bin} b Another bin
 * @return {number}
 */
os.histo.bin.sortByKey = function(a, b) {
  return goog.array.defaultCompare(a.getKey(), b.getKey());
};


/**
 * Sorts bins by key in descending order
 * @param {os.histo.Bin} a A bin
 * @param {os.histo.Bin} b Another bin
 * @return {number}
 */
os.histo.bin.sortByKeyDesc = function(a, b) {
  return os.histo.bin.sortByKey(b, a);
};


/**
 * Sorts bins by label in ascending order
 * @param {os.histo.Bin} a A bin
 * @param {os.histo.Bin} b Another bin
 * @return {number}
 */
os.histo.bin.sortByLabel = function(a, b) {
  var as = a.getLabel();
  var bs = b.getLabel();

  if (os.string.FLOAT.test(as) && os.string.FLOAT.test(bs)) {
    as = parseFloat(as);
    bs = parseFloat(bs);
  }

  return goog.array.defaultCompare(as, bs);
};


/**
 * Sorts bins by label in descending order
 * @param {os.histo.Bin} a A bin
 * @param {os.histo.Bin} b Another bin
 * @return {number}
 */
os.histo.bin.sortByLabelDesc = function(a, b) {
  return os.histo.bin.sortByLabel(b, a);
};

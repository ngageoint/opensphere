goog.provide('os.histo.Bin');
goog.provide('os.histo.bin');

goog.require('os.histo.Result');



/**
 * Represents a single bin in a histogram
 *
 * @constructor
 * @template T
 */
os.histo.Bin = function() {
  /**
   * @type {string|number}
   */
  this.key = '';

  /**
   * @type {string}
   */
  this.label = '';

  /**
   * @type {?Array.<!os.histo.Result.<T>>}
   * @protected
   */
  this.children = null;

  /**
   * @type {Array.<T>}
   */
  this.items = [];

  /**
   * The count of things in the bin; accessible for export
   * @type {number}
   */
  this['count'] = 0;

  /**
   * If the bin is considered selected; accessible for export
   * @type {boolean}
   */
  this['sel'] = false;

  /**
   * If the bin is considered highlighted; accessible for export
   * @type {boolean}
   */
  this['highlight'] = false;

  /**
   * This is just so we can show bins in a slickgrid instance. It will be set by the label so when a bin is recreated
   * slickgrid will identify it as the same item for selection purposes.
   * @type {string}
   */
  this['id'] = '';
};


/**
 * Adds an item to the bin
 *
 * @param {T} item
 */
os.histo.Bin.prototype.addItem = function(item) {
  this.items.push(item);
};


/**
 * Remove an item from the bin
 *
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
 *
 * @return {number}
 */
os.histo.Bin.prototype.getCount = function() {
  return this.items.length;
};


/**
 * Gets the items in the bin
 *
 * @return {Array.<T>}
 */
os.histo.Bin.prototype.getItems = function() {
  return this.items;
};


/**
 * Gets the key
 *
 * @return {string|number}
 */
os.histo.Bin.prototype.getKey = function() {
  return this.key;
};


/**
 * Sets the key
 *
 * @param {string|number} value
 */
os.histo.Bin.prototype.setKey = function(value) {
  this.key = value;
};


/**
 * Gets the label
 *
 * @return {string}
 */
os.histo.Bin.prototype.getLabel = function() {
  return this.label;
};


/**
 * Sets the label
 *
 * @param {string} label
 */
os.histo.Bin.prototype.setLabel = function(label) {
  this.label = label;
  this['id'] = label;
};


/**
 * Gets the child bins
 *
 * @return {?Array.<os.histo.Result.<T>>}
 */
os.histo.Bin.prototype.getChildren = function() {
  return this.children;
};


/**
 * Sets the child bins
 *
 * @param {?Array.<!os.histo.Result.<T>>} children
 */
os.histo.Bin.prototype.setChildren = function(children) {
  this.children = children;
};


/**
 * Returns the id
 *
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
 *
 * @param {os.histo.Bin} a A bin
 * @param {os.histo.Bin} b Another bin
 * @return {number}
 */
os.histo.bin.sortByCount = function(a, b) {
  return a.items.length > b.items.length ? 1 : a.items.length < b.items.length ? -1 : 0;
};


/**
 * Sorts bins by the number of items in the bin, in descending order
 *
 * @param {os.histo.Bin} a A bin
 * @param {os.histo.Bin} b Another bin
 * @return {number}
 */
os.histo.bin.sortByCountDesc = function(a, b) {
  return a.items.length > b.items.length ? -1 : a.items.length < b.items.length ? 1 : 0;
};


/**
 * Sorts bins by key
 *
 * @param {os.histo.Bin} a A bin
 * @param {os.histo.Bin} b Another bin
 * @return {number}
 */
os.histo.bin.sortByKey = function(a, b) {
  return a.key > b.key ? 1 : a.key < b.key ? -1 : 0;
};


/**
 * Sorts bins by key in descending order
 *
 * @param {os.histo.Bin} a A bin
 * @param {os.histo.Bin} b Another bin
 * @return {number}
 */
os.histo.bin.sortByKeyDesc = function(a, b) {
  return a.key > b.key ? -1 : a.key < b.key ? 1 : 0;
};


/**
 * Sorts bins by label in ascending order
 *
 * @param {os.histo.Bin} a A bin
 * @param {os.histo.Bin} b Another bin
 * @return {number}
 */
os.histo.bin.sortByLabel = function(a, b) {
  var al = a.getLabel();
  var bl = b.getLabel();

  if (os.string.FLOAT.test(al) && os.string.FLOAT.test(bl)) {
    al = parseFloat(al);
    bl = parseFloat(bl);
  }

  return al > bl ? 1 : al < bl ? -1 : 0;
};


/**
 * Sorts bins by label in descending order
 *
 * @param {os.histo.Bin} a A bin
 * @param {os.histo.Bin} b Another bin
 * @return {number}
 */
os.histo.bin.sortByLabelDesc = function(a, b) {
  return os.histo.bin.sortByLabel(b, a);
};

goog.module('os.histo.bin');
goog.module.declareLegacyNamespace();

const {FLOAT} = goog.require('os.string');

const Bin = goog.requireType('os.histo.Bin');

/**
 * "Unique" value used when a requested value is null or undefined. Crossfilter fails when values cannot be
 * directly compared, or when comparing mixed strings/numbers so this is used as a fallback number.
 *
 * Note: This number is intentionally larger than MAGIC_NAN for sorting purposes.
 *
 * @type {number}
 */
const MAGIC_EMPTY = 999999999999999998;

/**
 * "Unique" value used when a requested value cannot be coerced to a number. Crossfilter fails when values cannot be
 * directly compared, or when comparing mixed strings/numbers so this is used as a fallback number.
 *
 * @type {number}
 */
const MAGIC_NAN = 9999999998;

/**
 * @typedef {function(Bin, os.histo.Bin):number}
 */
let SortFn;

/**
 * Sorts bins by the number of items in the bin, in ascending order
 *
 * @param {Bin} a A bin
 * @param {os.histo.Bin} b Another bin
 * @return {number}
 */
const sortByCount = function(a, b) {
  return a.items.length > b.items.length ? 1 : a.items.length < b.items.length ? -1 : 0;
};

/**
 * Sorts bins by the number of items in the bin, in descending order
 *
 * @param {Bin} a A bin
 * @param {os.histo.Bin} b Another bin
 * @return {number}
 */
const sortByCountDesc = function(a, b) {
  return a.items.length > b.items.length ? -1 : a.items.length < b.items.length ? 1 : 0;
};

/**
 * Sorts bins by key
 *
 * @param {Bin} a A bin
 * @param {os.histo.Bin} b Another bin
 * @return {number}
 */
const sortByKey = function(a, b) {
  return a.key > b.key ? 1 : a.key < b.key ? -1 : 0;
};

/**
 * Sorts bins by key in descending order
 *
 * @param {Bin} a A bin
 * @param {os.histo.Bin} b Another bin
 * @return {number}
 */
const sortByKeyDesc = function(a, b) {
  return a.key > b.key ? -1 : a.key < b.key ? 1 : 0;
};

/**
 * Sorts bins by label in ascending order
 *
 * @param {Bin} a A bin
 * @param {os.histo.Bin} b Another bin
 * @return {number}
 */
const sortByLabel = function(a, b) {
  var al = a.getLabel();
  var bl = b.getLabel();

  if (FLOAT.test(al) && FLOAT.test(bl)) {
    al = parseFloat(al);
    bl = parseFloat(bl);
  }

  return al > bl ? 1 : al < bl ? -1 : 0;
};

/**
 * Sorts bins by label in descending order
 *
 * @param {Bin} a A bin
 * @param {os.histo.Bin} b Another bin
 * @return {number}
 */
const sortByLabelDesc = function(a, b) {
  return sortByLabel(b, a);
};

exports = {
  MAGIC_EMPTY,
  MAGIC_NAN,
  sortByCount,
  sortByCountDesc,
  sortByKey,
  sortByKeyDesc,
  sortByLabel,
  sortByLabelDesc,
  SortFn
};

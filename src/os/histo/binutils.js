goog.declareModuleId('os.histo.bin');

import {FLOAT} from '../string/string.js';

const {default: Bin} = goog.requireType('os.histo.Bin');


/**
 * "Unique" value used when a requested value is null or undefined. Crossfilter fails when values cannot be
 * directly compared, or when comparing mixed strings/numbers so this is used as a fallback number.
 *
 * Note: This number is intentionally larger than MAGIC_NAN for sorting purposes.
 *
 * @type {number}
 */
export const MAGIC_EMPTY = 999999999999999998;

/**
 * "Unique" value used when a requested value cannot be coerced to a number. Crossfilter fails when values cannot be
 * directly compared, or when comparing mixed strings/numbers so this is used as a fallback number.
 *
 * @type {number}
 */
export const MAGIC_NAN = 9999999998;

/**
 * @typedef {function(Bin, Bin):number}
 */
export let SortFn;

/**
 * Sorts bins by the number of items in the bin, in ascending order
 *
 * @param {Bin} a A bin
 * @param {Bin} b Another bin
 * @return {number}
 */
export const sortByCount = function(a, b) {
  return a.items.length > b.items.length ? 1 : a.items.length < b.items.length ? -1 : 0;
};

/**
 * Sorts bins by the number of items in the bin, in descending order
 *
 * @param {Bin} a A bin
 * @param {Bin} b Another bin
 * @return {number}
 */
export const sortByCountDesc = function(a, b) {
  return a.items.length > b.items.length ? -1 : a.items.length < b.items.length ? 1 : 0;
};

/**
 * Sorts bins by key
 *
 * @param {Bin} a A bin
 * @param {Bin} b Another bin
 * @return {number}
 */
export const sortByKey = function(a, b) {
  return a.key > b.key ? 1 : a.key < b.key ? -1 : 0;
};

/**
 * Sorts bins by key in descending order
 *
 * @param {Bin} a A bin
 * @param {Bin} b Another bin
 * @return {number}
 */
export const sortByKeyDesc = function(a, b) {
  return a.key > b.key ? -1 : a.key < b.key ? 1 : 0;
};

/**
 * Sorts bins by label in ascending order
 *
 * @param {Bin} a A bin
 * @param {Bin} b Another bin
 * @return {number}
 */
export const sortByLabel = function(a, b) {
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
 * @param {Bin} b Another bin
 * @return {number}
 */
export const sortByLabelDesc = function(a, b) {
  return sortByLabel(b, a);
};

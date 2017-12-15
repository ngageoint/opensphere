goog.provide('os.array');

goog.require('goog.array');


/**
 * Inserts a value into a sorted array. The array is not modified if the value is already present.
 *
 * This modifies {@link goog.array.binaryInsert} to return the insertion index instead of a boolean.
 *
 * @param {IArrayLike<VALUE>} array The array to modify.
 * @param {VALUE} value The object to insert.
 * @param {function(VALUE, VALUE): number=} opt_compareFn Optional comparison function by which the array is ordered.
 *     Should take 2 arguments to compare, and return a negative number, zero, or a positive number depending on whether
 *     the first argument is less than, equal to, or greater than the second.
 *
 * @return {number} The insertion index, or -1 if the value was already in the array.
 * @template VALUE
 */
os.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if (index < 0) {
    index = -index - 1;
    goog.array.insertAt(array, value, index);
    return index;
  }

  return -1;
};


/**
 * Sort items by the specified field in ascending order. Inject the field using goog.bind or goog.partial.
 * @param {string} field
 * @param {VALUE} a
 * @param {VALUE} b
 * @return {number}
 * @template VALUE
 */
os.array.sortByField = function(field, a, b) {
  return goog.array.defaultCompare(a[field], b[field]);
};


/**
 * Sort items by the specified field in descending order. Inject the field using goog.bind or goog.partial.
 * @param {string} field
 * @param {VALUE} a
 * @param {VALUE} b
 * @return {number}
 * @template VALUE
 */
os.array.sortByFieldDesc = function(field, a, b) {
  return goog.array.defaultCompare(b[field], a[field]);
};


/**
 * Calls a function for each element in an array. Skips holes in the array, does nothing if the array is null/undefined.
 * @param {Array.<T>} arr Array or array like object over which to iterate.
 * @param {?function(this: S, T, number, ?): ?} f The function to call for every
 *     element. This function takes 3 arguments (the element, the index and the
 *     array). The return value is ignored.
 * @param {S=} opt_obj The object to be used as the value of 'this' within f.
 * @template T,S
 */
os.array.forEachSafe = function(arr, f, opt_obj) {
  if (arr) {
    goog.array.forEach(arr, f, opt_obj);
  }
};


/**
 * Copies array elements from a source array to a destination array.
 * @param {Array} src Source array
 * @param {number} srcPos Source start index
 * @param {Array} dest Destination array
 * @param {number} destPos Destination start index
 * @param {number} length Number of elements to copy
 *
 * @see https://beta.appdev.proj.coe.ic.gov/heapexchange/stackoverflow.com/questions/15501573
 */
os.array.arrayCopy = function(src, srcPos, dest, destPos, length) {
  for (var i = srcPos; i < srcPos + length; i += 1) {
    dest[destPos++] = src[i];
  }
};


/**
 * Based on the goog.array.removeDuplicates method. This function discovers all the duplicate entries in an array
 * and returns them.
 * @param {Array<T>} arr The array to search for duplicates
 * @param {function(T):string=} opt_hashFn Optional function for determining uniqueness
 * @return {Array<T>}
 * @template T
 */
os.array.findDuplicates = function(arr, opt_hashFn) {
  var returnArray = [];
  var defaultHashFn = function(item) {
    return goog.isObject(current) ? 'o' + goog.getUid(current) :
        (typeof current).charAt(0) + current;
  };
  var hashFn = opt_hashFn || defaultHashFn;

  var seen = {};
  var cursorInsert = 0;
  var cursorRead = 0;

  while (cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = hashFn(current);
    if (!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
    } else {
      // put the second copy of the result in the return array
      returnArray[cursorInsert++] = current;
    }
  }
  return returnArray;
};


/**
 * @typedef {{
 *  data: Array,
 *  crossProduct: boolean,
 *  indexer: function(Object, boolean):(string|number)
 * }}
 */
os.array.JoinSet;


/**
 * @typedef {{
 *  data: Array,
 *  key: ?(string|number)
 * }}
 */
os.array.JoinSubset;


/**
 * @typedef {Object<string|number, Array<Object>>}
 */
os.array.JoinIndex;


/**
 * Sorts {@link os.array.JoinSet}'s by their crossProduct.
 * @param {os.array.JoinSet} a
 * @param {os.array.JoinSet} b
 * @return {number}
 */
os.array.crossProductSort = function(a, b) {
  return -1 * goog.array.defaultCompare(a.crossProduct, b.crossProduct);
};


/**
 * @param {Array<os.array.JoinSet>} sets An array of sets. Only one set with a <code>crossProduct</code>
 *  of <code>true</code> is supported.
 * @param {function(Object, Object):Object} copyFunction copy(from, to) implementation for the data in sets
 * @throws {Error} If two sets with <code>crossProduct = true</code> are given
 * @return {Array}
 */
os.array.join = function(sets, copyFunction) {
  var joined = [];
  sets = sets.sort(os.array.crossProductSort);

  var index = sets.reduce(
      /**
       * @param {os.array.JoinIndex} index The index to populate
       * @param {os.array.JoinSet} set The current join set
       * @param {number} i The current index
       * @return {os.array.JoinIndex} The index
       * @private
       */
      function(index, set, i) {
        return set.data.reduce(
            /**
             * @param {os.array.JoinIndex} index The index to populate
             * @param {Object} item The data item
             * @return {os.array.JoinIndex} The index
             */
            function(index, item) {
              var indexValue = set.indexer(item, set.crossProduct);

              if (set.crossProduct) {
                if (i > 0) {
                  // we are currently not computing cross products
                  throw new Error('Multiple cross product sets are not supported!');
                }

                if (!(indexValue in index)) {
                  index[indexValue] = [];
                }

                index[indexValue].push(item);
              } else if (indexValue !== undefined && indexValue !== null) {
                // ignore null/undefined values in the non-base set
                var indexList = index[indexValue];

                if (indexList) {
                  index[indexValue] = indexList.map(copyFunction.bind(null, item));
                }
              }

              return index;
            }, index || {});
      }, null);

  for (var key in index) {
    joined = joined.concat(index[key]);
  }

  return joined;
};


/**
 * Searches a flattened 2-dimensional array for the specified target using the binary search algorithm. The array is
 * assumed to contain equal-length groups of values, and the target is searched using a group length (stride) and offset
 * within each group.
 *
 * If no opt_compareFn is specified, elements are compared using `goog.array.defaultCompare`, which compares the
 * elements using the built in < and > operators. This will produce the expected behavior for homogeneous arrays of
 * String(s) and Number(s).
 *
 * The array specified <b>must</b> be sorted in ascending order (as defined by the comparison function) for the given
 * offset. Other offsets in each group do not need to be sorted. If the array is not sorted, results are undefined. If
 * the array contains multiple instances of the specified target value, any of these instances may be found.
 *
 * Adapted from `goog.array.binarySeach_`.
 *
 * Runtime: O(log n), where n is `(arr.length / stride)`.
 *
 * @param {IArrayLike<VALUE>} arr The array to be searched.
 * @param {TARGET} target The sought value.
 * @param {number} stride The array stride.
 * @param {number} offset The target offset. This will be clamped between `[0, stride - 1]`.
 * @param {function(TARGET, VALUE): number=} opt_compareFn Optional comparison function by which the array is ordered.
 *     Should take 2 arguments to compare, and return a negative number, zero, or a positive number depending on whether
 *     the first argument is less than, equal to, or greater than the second.
 * @return {number} Lowest index of the target group if found, otherwise `(-(insertion point) - 1)`. The insertion point
 *                  is where the next group should be inserted into arr to preserve the sorted property.  Return value
 *                  >= 0 iff target is found, and the return value will be the first index of the found <b>group</b>.
 * @template TARGET, VALUE
 */
os.array.binaryStrideSearch = function(arr, target, stride, offset, opt_compareFn) {
  var compareFn = opt_compareFn || goog.array.defaultCompare;

  // ensure the offset is within the group bounds
  offset = goog.math.clamp(offset, 0, stride - 1);

  var left = 0;           // inclusive
  var right = arr.length; // exclusive
  var found;
  while (left < right) {
    var middle = (left + right) >> 1;

    // ensure the middle is on a group interval, always preferring the left side of the split
    middle = middle - middle % stride;

    var compareResult = /** @type {function(?, ?): number} */ (compareFn)(target, arr[middle + offset]);
    if (compareResult > 0) {
      // move left index one interval to the right of middle
      left = middle + stride;
    } else {
      // right index is now the middle
      right = middle;

      // we are looking for the lowest index so we can't return immediately.
      found = !compareResult;
    }
  }
  // left is the index if found, or the insertion point otherwise.
  // ~left is a shorthand for -left - 1.
  return found ? left : ~left;
};

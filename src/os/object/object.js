/**
 * @fileoverview Utilities for merging objects
 */

goog.provide('os.object');
goog.require('goog.array');
goog.require('goog.string');


/**
 * The key to use to delete a value during merges
 * @type {string}
 */
os.object.DELETE_VAL = '__delete__';


/**
 * The key to use to ignore a value during merges
 * @type {string}
 */
os.object.IGNORE_VAL = '__ignore__';


/**
 * The value returned by the base Object.prototype.toString
 * @type {string}
 */
os.object.STRING_VAL = String({});


/**
 * Create a new object, removing all keys with an undefined value.
 * @param {T} obj The original object
 * @return {T} The trimmed object
 * @template T
 */
os.object.prune = function(obj) {
  if (!obj) {
    return obj;
  }

  var newObj = {};
  for (var key in obj) {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
      obj[key] = undefined;
    }
  }

  return newObj;
};


/**
 * Merges two objects
 * @param {Object} from The object to merge
 * @param {Object} to The object to which to merge
 * @param {boolean=} opt_overwrite Whether or not to overwrite existing values.
 *    Defaults to true.
 * @param {boolean=} opt_nullOverwrite Whether or not null and undefined are treated
 *    as override values. Defaults to true
 */
os.object.merge = function(from, to, opt_overwrite, opt_nullOverwrite) {
  if (!goog.isDefAndNotNull(opt_overwrite)) {
    opt_overwrite = true;
  }

  if (!goog.isDefAndNotNull(opt_nullOverwrite)) {
    opt_nullOverwrite = true;
  }

  for (var key in from) {
    var fval = from[key];
    if (key in to) {
      var tval = to[key];

      if (((fval === null || fval === undefined) && !opt_nullOverwrite) || fval === os.object.IGNORE_VAL) {
        continue;
      }

      if (fval === os.object.DELETE_VAL) {
        if (opt_overwrite) {
          delete to[key];
        }
      } else if (os.object.isPrimitive(fval) || os.object.isPrimitive(tval)) {
        if (opt_overwrite) {
          to[key] = from[key];
        }
      } else {
        os.object.merge(fval, tval, opt_overwrite, opt_nullOverwrite);
      }
    } else if (os.object.isPrimitive(fval)) {
      to[key] = fval;
    } else {
      // don't set the value to an Object, or changes to the target will affect the source
      to[key] = {};
      os.object.merge(fval, to[key], opt_overwrite, opt_nullOverwrite);
    }
  }
};


/**
 * Determines if the provided value is a primitive.
 * @param {?} value The value to check.
 * @param {string=} opt_type The type from `goog.typeOf`, to avoid multiple calls.
 * @return {boolean} Whether or not the value is a primitive.
 */
os.object.isPrimitive = function(value, opt_type) {
  if (value) {
    var type = opt_type || goog.typeOf(value);
    if (type == 'object') {
      // if an object has multiple prototypes in its chain, it extends Object and will be considered a primitive. the
      // first prototype should never be null here, so that test is primarily a sanity check.
      var proto = Object.getPrototypeOf(value);
      return proto == null || Object.getPrototypeOf(proto) != null;
    }
  }
  return true;
};


/**
 * @param {!Object} obj The object to which to assign the property
 * @param {!Array.<string|number>} keys which indicate the namespace to which to assign the value
 * @param {?} value
 */
os.object.set = function(obj, keys, value) {
  var lastLevel = obj;
  var lastKeyIndex = keys.length - 1;
  goog.array.forEach(keys, function(key, index) {
    if (index === lastKeyIndex) {
      lastLevel[key] = value;
    } else {
      lastLevel[key] = goog.isObject(lastLevel[key]) ? lastLevel[key] : {};
      lastLevel = lastLevel[key];
    }
  });
};


/**
 * Reduce a deep hieractical JSON into a shallow object, where the depth is represented in the key as
 * a delimited string.  Arrays and primitives remain intact, while nested objects are reduced further.
 * E.g.: {a: {b: 'c', d: 'f'}} becomes {'a.b': 'c', 'a.d': 'f'}
 * @param {*|undefined} obj
 * @param {string=} opt_prefix The delimited prefix to append the keys to
 * @param {string=} opt_delim
 * @return {Object.<string, *>}
 */
os.object.reduce = function(obj, opt_prefix, opt_delim) {
  var prefix = opt_prefix != null ? opt_prefix : '';
  var delim = opt_delim != null ? opt_delim : '.';
  var result = {};

  // skip undefined values
  if (obj !== undefined) {
    if (os.object.isPrimitive(obj) || goog.isArray(obj)) {
      // write primitives and arrays to the reduced result
      result[prefix] = obj;
    } else if (goog.isObject(obj)) {
      if (goog.object.isEmpty(obj)) {
        // if the object doesn't contain any keys, write the empty object to the result
        result[prefix] = obj;
      } else {
        // otherwise continue reducing the object
        for (var key in obj) {
          var reduced = os.object.reduce(obj[key], prefix ? prefix + delim + key : key, delim);
          goog.object.extend(result, reduced);
        }
      }
    }
  }

  return result;
};


/**
 * The counterpart to {@see os.object.reduce}.  Expands delimited keys to a deep hierarctical JSON object.
 * @param {!Object.<string, *>} obj
 * @param {string=} opt_delim
 * @return {!Object}
 */
os.object.expand = function(obj, opt_delim) {
  var delim = opt_delim || '.';
  var result = {};
  for (var key in obj) {
    os.object.set(result, key.split(delim), obj[key]);
  }
  return result;
};


/**
 * Delete a value by it's keys.  Will also delete all the keys in the specified path, so long as there aren't sibling
 * values that need to remain.  For example, deleting 'a.b' from {a: {b: 'b'}} will yield {};
 * deleting 'a.b' from {a: {b: 'b', c: 'c'}} will yield {a: {c: 'c'}}
 * @param {!Object.<string, *>} obj
 * @param {!Array.<!string|!number>|!string} keys
 */
os.object.delete = function(obj, keys) {
  if (goog.typeOf(keys) === 'string') {
    keys = keys.split('.');
  }

  if (keys.length > 0) {
    var lastKey = keys[keys.length - 1];
    var oneLessKeys = keys.slice(0, keys.length - 1);
    var oneLessObject = goog.object.getValueByKeys(obj, oneLessKeys);
    if (goog.typeOf(oneLessObject) == 'object') {
      delete oneLessObject[lastKey];
      if (goog.object.getCount(/** @type {Object} */ (oneLessObject)) === 0) {
        // no more keys, delete parents
        os.object.delete(obj, oneLessKeys);
      }
    }
  }
};


/**
 * Parse only the values of an object using JSON.os.parse.  Operation occurs inline on the object.
 * @param {Object.<string, *>} obj
 */
os.object.parseValues = function(obj) {
  for (var key in obj) {
    if (goog.isDef(obj[key]) && goog.isString(obj[key])) {
      obj[key] = JSON.parse(/** @type {string} */ (obj[key]));
    }
  }
};


/**
 * Stringify only the values of an object using JSON.os.parse.  Operation occurs inline on the object.
 * @param {Object} obj
 */
os.object.stringifyValues = function(obj) {
  for (var key in obj) {
    obj[key] = JSON.stringify(obj[key]);
  }
};


/**
 * Get the first non-empty value from a list of objects.
 * @param {string} key The key
 * @param {...Object} var_args The objects to search
 * @return {*}
 */
os.object.getFirstValue = function(key, var_args) {
  var value;
  for (var i = 1; i < arguments.length; i++) {
    var obj = arguments[i];
    if (obj && obj[key] != undefined) {
      value = obj[key];
      break;
    }
  }

  return value;
};


/**
 * Creates a value extractor function. Use the provided attribute to retrieve a value from an item.  Useful
 * for collection iterators and such to extract values of their records.
 *
 * Example: goog.array.removeDuplicates(arrWithElementsWithIds, newArr, os.object.getValueExtractor('id'));
 *
 * @param {!string} attribute The attribute whose value to retrieve from an item.  If the attribute name references
 *   a function, it is invoked on the item.
 * @return {function(*):*} The function which can be registered as the value extractor on an collection.
 */
os.object.getValueExtractor = function(attribute) {
  return function(i) {
    return goog.isFunction(i[attribute]) ? i[attribute]() : i[attribute];
  };
};


/**
 * Compare two objects by their respective values of the provided field
 * @param {!string} field The name of the field.  If it's a publicly accessible member then it will be used.  If its the
 *  name of a function then it will be invoked.  Otherwise we'll try to turn it into a "getter".  If all these cases
 *  fail, the return value will indicate the two objects are equivalent.
 * @param {Object} o1 Object one
 * @param {Object} o2 Object two
 * @param {function(*, *):number=} opt_comparitor Optional comparison function.
 *  Otherwise {@link goog.array.defaultCompare} will be used
 * @return {number}
 */
os.object.compareByField = function(field, o1, o2, opt_comparitor) {
  var v1 = os.object.getCompareFieldValue_(field, o1);
  var v2 = os.object.getCompareFieldValue_(field, o2);
  return opt_comparitor ? opt_comparitor(v1, v2) : goog.array.defaultCompare(v1, v2);
};


/**
 * Get an object's field value
 * @param {!string} field
 * @param {Object} o
 * @return {*}
 * @private
 */
os.object.getCompareFieldValue_ = function(field, o) {
  if (goog.isDefAndNotNull(o)) {
    var value;
    if (o[field]) {
      if (goog.isFunction(o[field])) {
        value = o[field]();
      } else {
        value = o[field];
      }
    } else if (!goog.string.startsWith(field, 'get')) {
      var modField = 'get' + goog.string.toTitleCase(field);
      value = os.object.getCompareFieldValue_(modField, o);
    }
  }
  return value || '';
};


/**
 * Clones a value. The input may be an Object, Array, or basic type. Objects and
 * arrays will be cloned recursively.
 *
 * WARNINGS:
 * {@link os.object.unsafeClone} does not detect reference loops. Objects
 * that refer to themselves will cause infinite recursion.
 *
 * {@link os.object.unsafeClone} is unaware of unique identifiers, and
 * copies UIDs created by <code>getUid</code> into cloned results.
 *
 * This was copied from os.object.unsafeClone and modified to prevent polyfills from being added to the new object
 * as a property.
 *
 * @param {T} obj The value to clone.
 * @return {T} A clone of the input value.
 * @template T
 */
os.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      // make sure it's a property on the object and not the prototype. this protects against adding polyfills to the
      // new object as a property.
      if (obj.hasOwnProperty(key)) {
        clone[key] = os.object.unsafeClone(obj[key]);
      }
    }
    return clone;
  }

  return obj;
};

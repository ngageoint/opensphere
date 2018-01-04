/**
 * @fileoverview Replacing Closure goog.object functions to check hasOwnProperty. This makes the functions work with
 *               polyfills to Array and Object.
 */

goog.provide('os.mixin.closure');

goog.require('goog.html.TrustedResourceUrl');
goog.require('goog.object');


/**
 * Does a flat clone of the object.
 *
 * @param {Object<K,V>} obj Object to clone.
 * @return {!Object<K,V>} Clone of the input object.
 * @template K,V
 *
 * @suppress {duplicate}
 */
goog.object.clone = function(obj) {
  // We cannot use the prototype trick because a lot of methods depend on where
  // the actual key is set.

  var res = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      res[key] = obj[key];
    }
  }
  return res;
  // We could also use goog.mixin but I wanted this to be independent from that.
};


/**
 * Calls a function for each element in an object/map/hash.
 *
 * @param {Object<K,V>} obj The object over which to iterate.
 * @param {function(this:T,V,?,Object<K,V>):?} f The function to call
 *     for every element. This function takes 3 arguments (the value, the
 *     key and the object) and the return value is ignored.
 * @param {T=} opt_obj This is used as the 'this' object within f.
 * @template T,K,V
 *
 * @suppress {duplicate}
 */
goog.object.forEach = function(obj, f, opt_obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      f.call(/** @type {?} */ (opt_obj), obj[key], key, obj);
    }
  }
};


/**
 * This prevents Array polyfills from being included in the count.
 *
 * Returns the number of key-value pairs in the object map.
 * @param {Object} obj The object for which to get the number of key-value
 *     pairs.
 * @return {number} The number of key-value pairs in the object map.
 *
 * @suppress {duplicate}
 */
goog.object.getCount = function(obj) {
  // JS1.5 has __count__ but it has been deprecated so it raises a warning...
  // in other words do not use. Also __count__ only includes the fields on the
  // actual object and not in the prototype chain.
  var rv = 0;
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      rv++;
    }
  }
  return rv;
};


/**
 * This prevents Array polyfills from being included in the keys.
 *
 * Returns the keys of the object/map/hash.
 *
 * @param {Object} obj The object from which to get the keys.
 * @return {!Array<string>} Array of property keys.
 *
 * @suppress {duplicate}
 */
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      res[i++] = key;
    }
  }
  return res;
};


/**
 * This prevents Array polyfills from being included in the keys.
 *
 * Returns the values of the object/map/hash.
 *
 * @param {Object<K,V>} obj The object from which to get the values.
 * @return {!Array<V>} The values in the object/map/hash.
 * @template K,V
 *
 * @suppress {duplicate}
 */
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      res[i++] = obj[key];
    }
  }
  return res;
};


/**
 * Whether the object/map/hash is empty.
 *
 * @param {Object} obj The object to test.
 * @return {boolean} true if obj is empty.
 *
 * @suppress {duplicate}
 */
goog.object.isEmpty = function(obj) {
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
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
 * @param {*} obj The value to clone.
 * @return {*} A clone of the input value.
 *
 * @suppress {duplicate}
 */
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if (type == 'object' || type == 'array') {
    if (obj.clone) {
      return obj.clone();
    }
    var clone = type == 'array' ? [] : {};
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        clone[key] = goog.object.unsafeClone(obj[key]);
      }
    }
    return clone;
  }

  return obj;
};


/**
 * Replace the trusted resource URL regexp. The original requires an absolute URL, which we cannot define at compile
 * time since we often read these from settings.
 *
 * Removing this will require an alternative to `goog.net.jsloader.safeLoad`.
 * @suppress {accessControls|const}
 */
os.mixin.replaceTrustedResourceUrl = function() {
  goog.html.TrustedResourceUrl.BASE_URL_ = new RegExp('');
};
os.mixin.replaceTrustedResourceUrl();

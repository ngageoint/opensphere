/**
 * @fileoverview This file provides a workaround to the problem of calling instanceof on an object made in one window
 * context using the class definition created in a different window context. Classes should register themselves using
 * {@link os.registerClass}, passing in their name and constructor. {@link os.instanceOf} should be used instead
 * of the native instanceof when code may be executing in this fashion.
 */

goog.provide('os.instanceOf');
goog.provide('os.registerClass');


/**
 * Class registry for cross-window instanceof calls.
 * @type {Object<string, !function(new: Object, ...?)>}
 * @private
 */
os.classRegistry_ = {};


/**
 * Registers a class by name.
 * @param {string} name The class name
 * @param {!function(new: Object, ...?)} clazz The constructor
 * @template T
 */
os.registerClass = function(name, clazz) {
  os.classRegistry_[name] = clazz;
};


/**
 * Checks if an object is an instance of the provided class type across multiple windows. This is intended for use
 * where an object may be created in one window context, but its type needs to be checked in another. If calling from
 * a root parent, the native instanceof will be returned. If the window has a parent, this will return true if the
 * instanceof check passes in either the current window or any of its parents.
 *
 * @param {*} object The object to test
 * @param {string} type The registered class name
 * @return {boolean} If the object is an instance of the registered type in this window or any of its parents
 */
os.instanceOf = function(object, type) {
  if (window == null || object == null) {
    return false;
  }

  try {
    var parent = os.getParentWindow();
    if (!type || !os.classRegistry_[type]) {
      return false;
    } else if (parent === window) {
      return object instanceof os.classRegistry_[type];
    } else if (parent) {
      var pCore = parent['os'];
      return object instanceof os.classRegistry_[type] ||
          (pCore != null && pCore['instanceOf'] != null && pCore['instanceOf'](object, type));
    }
  } catch (e) {
    // don't worry about exceptions, just return false
  }

  // something went wrong - parent should *never* be null/undefined
  return false;
};
goog.exportSymbol('os.instanceOf', os.instanceOf);

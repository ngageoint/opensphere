/**
 * @fileoverview This module was replaced by os.classRegistry in order to share the local registry between instanceOf
 *               and registerClass. That module should be preferred, but keeping these around for backward
 *               compatibility. They should eventually be deprecated and removed, but for now we'll avoid adding noise
 *               to the build warnings.
 */
goog.module('os.instanceOf');

const {instanceOf} = goog.require('os.classRegistry');


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
exports = instanceOf;

// Export this function unminified on window so it can be called on parent windows.
goog.exportSymbol('os.instanceOf', instanceOf);

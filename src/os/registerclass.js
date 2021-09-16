/**
 * @fileoverview This module was replaced by os.classRegistry in order to share the local registry between instanceOf
 *               and registerClass. That module should be preferred, but keeping these around for backward
 *               compatibility. They should eventually be deprecated and removed, but for now we'll avoid adding noise
 *               to the build warnings.
 */
goog.module('os.registerClass');

const {registerClass} = goog.require('os.classRegistry');


/**
 * Registers a class by name.
 *
 * @param {string} name The class name
 * @param {!function(new: Object, ...?)} clazz The constructor
 * @template T
 */
exports = registerClass;

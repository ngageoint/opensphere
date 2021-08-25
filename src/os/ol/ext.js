/**
 * @fileoverview This fixes a compiler issue where ol.ext.rbush fails to load because ol.ext doesn't exist. In the
 *               compiled application, the goog.provide call for ol.ext.rbush quotes the string which does not rename
 *               any of that namespace, but the ol.ext.rbush assignment at the top of the file is using compiled
 *               symbols that were never created.
 */
goog.module('ol.ext');
goog.module.declareLegacyNamespace();

/**
 * Create the ol.ext namespace.
 * @type {!Object<string, *>}
 */
exports = {};

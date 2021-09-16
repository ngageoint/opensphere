goog.module('os.histo');

const BinMethod = goog.require('os.histo.BinMethod');

const IBinMethod = goog.requireType('os.histo.IBinMethod');


/**
 * Clones a bin method.
 *
 * @param {IBinMethod} method The method
 * @return {IBinMethod}
 */
const cloneMethod = function(method) {
  var clone = null;
  if (method && method.getBinType() in BinMethod) {
    var clazz = BinMethod[method.getBinType()];
    clone = new clazz();
    clone.restore(method.persist());
  }

  return clone;
};

/**
 * Restore a bin method from config.
 *
 * @param {Object} config The bin method config
 * @return {IBinMethod|undefined} The bin method if the type was registered, or undefined if not
 */
const restoreMethod = function(config) {
  var method;
  if (config) {
    var type = /** @type {string|undefined} */ (config['type']);
    if (type) {
      var clazz = BinMethod[type];
      if (clazz) {
        method = new clazz();
        method.restore(config);
      }
    }
  }

  return method;
};

exports = {
  cloneMethod,
  restoreMethod
};

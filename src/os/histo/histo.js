goog.declareModuleId('os.histo');

import BinMethod from './binmethod.js';

const {default: IBinMethod} = goog.requireType('os.histo.IBinMethod');


/**
 * Clones a bin method.
 *
 * @param {IBinMethod} method The method
 * @return {IBinMethod}
 */
export const cloneMethod = function(method) {
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
export const restoreMethod = function(config) {
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

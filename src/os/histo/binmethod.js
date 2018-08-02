goog.provide('os.histo');
goog.provide('os.histo.BinMethod');

goog.require('os.histo.DateBinMethod');
goog.require('os.histo.NumericBinMethod');
goog.require('os.histo.UniqueBinMethod');


/**
 * Bin methods available in the application.
 * @type {!Object<string, !function(new: os.histo.IBinMethod)>}
 * @const
 */
os.histo.BinMethod = {
  'Unique': os.histo.UniqueBinMethod,
  'Date': os.histo.DateBinMethod,
  'Numeric': os.histo.NumericBinMethod
};


/**
 * Clones a bin method.
 * @param {os.histo.IBinMethod} method The method
 * @return {os.histo.IBinMethod}
 */
os.histo.cloneMethod = function(method) {
  var clone = null;
  if (method && method.getBinType() in os.histo.BinMethod) {
    var clazz = os.histo.BinMethod[method.getBinType()];
    clone = new clazz();
    clone.restore(method.persist());
  }

  return clone;
};


/**
 * Restore a bin method from config.
 * @param {Object} config The bin method config
 * @return {os.histo.IBinMethod|undefined} The bin method if the type was registered, or undefined if not
 */
os.histo.restoreMethod = function(config) {
  var method;
  if (config) {
    var type = /** @type {string|undefined} */ (config['type']);
    if (type) {
      var clazz = os.histo.BinMethod[type];
      if (clazz) {
        method = new clazz();
        method.restore(config);
      }
    }
  }

  return method;
};

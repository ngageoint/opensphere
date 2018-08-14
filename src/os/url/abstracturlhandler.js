goog.provide('os.url.AbstractUrlHandler');
goog.require('goog.Disposable');
goog.require('goog.Uri');



/**
 * Abstract class for URL parameter handling. These classes are designed to handle URLs of the form:
 *
 *   https://www.example.com/#/?key=value1,value&key2=value3
 *
 * Everything after the # in the fragment is grabbed and initially checked, then any change is listened for. When
 * a change occurs, the parameters are checked for anything added or removed.
 * @extends {goog.Disposable}
 * @constructor
 */
os.url.AbstractUrlHandler = function() {
  os.url.AbstractUrlHandler.base(this, 'constructor');

  /**
   * @type {Object}
   * @protected
   */
  this.handlesCache = {};

  /**
   * @type {Array<string>}
   * @protected
   */
  this.keys = [];
};
goog.inherits(os.url.AbstractUrlHandler, goog.Disposable);


/**
 * @inheritDoc
 */
os.url.AbstractUrlHandler.prototype.disposeInternal = function() {
  this.keys.forEach(this.unhandleAll);
  os.url.AbstractUrlHandler.base(this, 'disposeInternal');
};


/**
 * Splits up the fragment and handles its components.
 * @param {string} key The key to handle
 * @param {string} value The value to handle
 */
os.url.AbstractUrlHandler.prototype.handle = function(key, value) {
  if (this.handles(key)) {
    if (value) {
      var newCache = [];
      var oldCache = this.handlesCache[key] || [];

      // we handle that key, so construct a new cache while keeping a reference to the old one around
      var values = value.split(',');
      for (var j = 0, jj = values.length; j < jj; j++) {
        var v = decodeURIComponent(values[j]);

        // check if v is falsy--we don't want to handle empty strings with a trailing comma, i.e. <value1>,<value2>,
        if (v) {
          if (oldCache.indexOf(v) == -1) {
            this.handleInternal(key, v);
          }

          newCache.push(v);
        }
      }

      // set the new cache reference
      this.handlesCache[key] = newCache;

      for (var k = 0, kk = oldCache.length; k < kk; k++) {
        var oldVal = oldCache[k];
        if (newCache.indexOf(oldVal) === -1) {
          // value was in the old cache, but not the new one, so undo whatever it did
          this.unhandleInternal(key, oldVal);
        }
      }
    } else {
      // value is empty/undefined, unhandle everything under it
      this.unhandleAll(key);
    }
  }
};


/**
 * Gets the array of keys that the handler handles.
 * @return {Array<string>}
 */
os.url.AbstractUrlHandler.prototype.getKeys = function() {
  return this.keys;
};


/**
 * Whether a key is handled.
 * @param {string} key
 * @return {boolean}
 */
os.url.AbstractUrlHandler.prototype.handles = function(key) {
  return this.keys.indexOf(key) > -1;
};


/**
 * Handles a key value pair. Should be implemented by extending classes.
 * @param {string} key
 * @param {string} value
 */
os.url.AbstractUrlHandler.prototype.handleInternal = goog.abstractMethod;


/**
 * Handles a key value pair. To be implemented by extending classes, but doesn't have to be.
 * @param {string} key
 * @param {string} value
 */
os.url.AbstractUrlHandler.prototype.unhandleInternal = function(key, value) {};


/**
 * Unhandles all values for the given key.
 * @param {string} key The key to unhandle all values for.
 */
os.url.AbstractUrlHandler.prototype.unhandleAll = function(key) {
  if (key in this.handlesCache) {
    var oldCache = this.handlesCache[key];
    for (var l = 0, ll = oldCache.length; l < ll; l++) {
      this.unhandleInternal(key, oldCache[l]);
    }

    delete this.handlesCache[key];
  }
};

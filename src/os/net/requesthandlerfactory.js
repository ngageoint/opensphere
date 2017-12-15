goog.provide('os.net.RequestHandlerFactory');
goog.require('goog.array');
goog.require('os.net.IRequestHandler');


/**
 * The list of handler classes
 * @type {?Array.<Function>}
 * @private
 */
os.net.RequestHandlerFactory.list_ = null;


/**
 * Adds a handler type to the factory
 * @param {Function} clazz The constructor for the class
 */
os.net.RequestHandlerFactory.addHandler = function(clazz) {
  /** @type {?Array.<Function>} */
  var list = os.net.RequestHandlerFactory.list_;

  if (!list) {
    list = os.net.RequestHandlerFactory.list_ = [];
  }

  if (list.indexOf(clazz) == -1) {
    list.push(clazz);
  }
};


/**
 * @param {Function} clazz The class to remove
 */
os.net.RequestHandlerFactory.removeHandler = function(clazz) {
  goog.array.remove(os.net.RequestHandlerFactory.list_, clazz);
};


/**
 * Gets an array of handlers that support the given method and uri.
 * @param {string} method The request method
 * @param {goog.Uri} uri The URI
 * @return {?Array.<os.net.IRequestHandler>}
 */
os.net.RequestHandlerFactory.getHandlers = function(method, uri) {
  /** @type {?Array.<Function>} */
  var list = os.net.RequestHandlerFactory.list_;

  /** @type {?Array.<os.net.IRequestHandler>} */
  var handlers = null;

  if (list) {
    for (var i = 0, n = list.length; i < n; i++) {
      var clazz = /** @type {Function} */ (list[i]);
      var handler = /** @type {os.net.IRequestHandler} */ (new clazz());

      if (handler.handles(method, uri)) {
        if (!handlers) {
          handlers = [handler];
        } else {
          handlers.push(handler);
        }
      }
    }
  }

  if (handlers) {
    handlers.sort(
        /**
         * @param {os.net.IRequestHandler} a
         * @param {os.net.IRequestHandler} b
         * @return {number} per compare functions
         */
        function(a, b) {
          return -1 * goog.array.defaultCompare(a.getScore(), b.getScore());
        });
  }

  return handlers;
};

goog.module('os.net.RequestHandlerFactory');
goog.module.declareLegacyNamespace();

const {defaultCompare} = goog.require('goog.array');
const {remove} = goog.require('ol.array');

const IRequestHandler = goog.requireType('os.net.IRequestHandler');


/**
 * The list of handler classes
 * @type {?Array<Function>}
 */
let handlerClasses = null;

/**
 * Adds a handler type to the factory
 *
 * @param {Function} clazz The constructor for the class
 */
const addHandler = function(clazz) {
  /** @type {?Array<Function>} */
  var list = handlerClasses;

  if (!list) {
    list = handlerClasses = [];
  }

  if (list.indexOf(clazz) == -1) {
    list.push(clazz);
  }
};

/**
 * @param {Function} clazz The class to remove
 */
const removeHandler = function(clazz) {
  remove(handlerClasses, clazz);
};

/**
 * Reset handlers registered with the module.
 */
const resetHandlers = function() {
  handlerClasses = null;
};

/**
 * Get all handlers registered with the module.
 * @return {?Array<Function>}
 */
const getAllHandlers = () => handlers;

/**
 * Gets an array of handlers that support the given method and uri.
 *
 * @param {string} method The request method
 * @param {goog.Uri} uri The URI
 * @param {number=} opt_timeout The timeout
 * @return {?Array<IRequestHandler>}
 */
const getHandlers = function(method, uri, opt_timeout) {
  /** @type {?Array<Function>} */
  var list = handlerClasses;

  /** @type {?Array<IRequestHandler>} */
  var handlers = null;

  if (list) {
    for (var i = 0, n = list.length; i < n; i++) {
      var clazz = /** @type {Function} */ (list[i]);
      var handler = /** @type {IRequestHandler} */ (new clazz());
      if (opt_timeout) {
        handler.setTimeout(opt_timeout);
      }
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
         * @param {IRequestHandler} a
         * @param {os.net.IRequestHandler} b
         * @return {number} per compare functions
         */
        function(a, b) {
          return -1 * defaultCompare(a.getScore(), b.getScore());
        });
  }

  return handlers;
};

exports = {
  addHandler,
  removeHandler,
  resetHandlers,
  getAllHandlers,
  getHandlers
};

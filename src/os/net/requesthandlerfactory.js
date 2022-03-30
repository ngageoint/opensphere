goog.declareModuleId('os.net.RequestHandlerFactory');

import {remove} from 'ol/src/array.js';

const {defaultCompare} = goog.require('goog.array');

const {default: IRequestHandler} = goog.requireType('os.net.IRequestHandler');


/**
 * The list of handler classes registered with the module.
 * @type {!Array<function(new: IRequestHandler, ...)>}
 */
const handlerClasses = [];

/**
 * Adds a handler type to the factory
 *
 * @param {function(new: IRequestHandler, ...)} clazz The constructor for the class
 */
export const addHandler = function(clazz) {
  if (handlerClasses.indexOf(clazz) == -1) {
    handlerClasses.push(clazz);
  }
};

/**
 * @param {function(new: IRequestHandler, ...)} clazz The class to remove
 */
export const removeHandler = function(clazz) {
  remove(handlerClasses, clazz);
};

/**
 * Reset handlers registered with the module.
 */
export const resetHandlers = function() {
  handlerClasses.length = 0;
};

/**
 * Get all handlers registered with the module.
 * @return {!Array<function(new: IRequestHandler, ...)>}
 */
export const getAllHandlers = () => handlerClasses;

/**
 * Gets an array of handlers that support the given method and uri.
 *
 * @param {string} method The request method
 * @param {goog.Uri} uri The URI
 * @param {number=} opt_timeout The timeout
 * @return {?Array<IRequestHandler>}
 */
export const getHandlers = function(method, uri, opt_timeout) {
  var handlers = null;

  for (var i = 0, n = handlerClasses.length; i < n; i++) {
    var clazz = handlerClasses[i];
    var handler = new clazz();
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

  if (handlers) {
    handlers.sort(
        /**
         * @param {IRequestHandler} a
         * @param {IRequestHandler} b
         * @return {number} per compare functions
         */
        function(a, b) {
          return -1 * defaultCompare(a.getScore(), b.getScore());
        });
  }

  return handlers;
};

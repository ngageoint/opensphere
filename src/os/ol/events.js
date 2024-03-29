goog.declareModuleId('os.ol.events');

const {listen, unlisten} = goog.require('ol.events');


/**
 * Registers an event listener on an event target for a list of events.
 *
 * @param {ol.EventTargetLike} target Event target.
 * @param {!Array<string>} types Event types.
 * @param {ol.EventsListenerFunctionType} listener Listener.
 * @param {Object=} opt_this Object referenced by the `this` keyword in the listener. Default is the `target`.
 * @param {boolean=} opt_once If true, add the listener as one-off listener.
 * @return {!Array<ol.EventsKey>} Unique keys for the listeners.
 */
export const listenEach = function(target, types, listener, opt_this, opt_once) {
  var keys = [];
  for (var i = 0; i < types.length; i++) {
    keys.push(listen(target, types[i], listener, opt_this, opt_once));
  }
  return keys;
};

/**
 * Unregisters event listeners on an event target for a list of events.
 *
 * @param {ol.EventTargetLike} target Event target.
 * @param {!Array<string>} types Event types.
 * @param {ol.EventsListenerFunctionType} listener Listener.
 * @param {Object=} opt_this Object referenced by the `this` keyword in the listener. Default is the `target`.
 */
export const unlistenEach = function(target, types, listener, opt_this) {
  for (var i = 0; i < types.length; i++) {
    unlisten(target, types[i], listener, opt_this);
  }
};

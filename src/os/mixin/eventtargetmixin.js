/**
 * @fileoverview Modifications to {@link ol.events.EventTarget}.
 */
goog.provide('os.mixin.events.EventTarget');

goog.require('ol.events.EventTarget');


/**
 * Updates an event listener to be removed on its next attempted call after replacing it with no-op function.
 *
 * @param {string} type Type
 * @param {ol.EventsListenerFunctionType} listener Event listener
 */
ol.events.EventTarget.prototype.removeEventListenerDelayed = function(type, listener) {
  var listeners = this.listeners_[type];
  if (listeners) {
    var index = listeners.indexOf(listener);
    if (type in this.pendingRemovals_) {
      ++this.pendingRemovals_[type];
    } else {
      this.pendingRemovals_[type] = 1;
    }
    listeners[index] = ol.nullFunction;
  }
};

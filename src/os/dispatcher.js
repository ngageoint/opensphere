goog.module('os.Dispatcher');
goog.module.declareLegacyNamespace();

const os = goog.require('os');
const EventTarget = goog.require('goog.events.EventTarget');


// This module is named like a Class, but is not. This is for compatibility with the existing os.dispatcher

// TODO when everything is transformed off the deprecated os.dispatcher, remove references to it from here and
// switch back to using a local "instance" variable like normal
// let instance = null;

/**
 * Get the global dispatcher.
 * @return {!EventTarget}
 */
function getInstance() {
  if (!os.dispatcher) {
    os.dispatcher = new EventTarget(); // nudge the compiler; can't just use setInstance() or it thinks it could be null
  }
  return os.dispatcher;
}

/**
 * Set the global dispatcher.
 * @param {EventTarget} value
 */
function setInstance(value) {
  os.dispatcher = value;
}

exports = {
  getInstance,
  setInstance
};

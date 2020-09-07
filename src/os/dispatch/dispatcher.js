goog.module('os.dispatch.dispatcher');
goog.module.declareLegacyNamespace();

const EventTarget = goog.require('goog.events.EventTarget');

/**
 * @type {EventTarget|null}
 */
let instance = null;

/**
 * singleton
 * @return {EventTarget}
 */
function getInstance() {
  if (!instance) {
    setInstance(new EventTarget());
  }
  return instance;
}

/**
 * manually set the instance value in the is module
 * @param {EventTarget} value
 */
function setInstance(value) {
  instance = value;
}

exports = {
  getInstance,
  setInstance
};

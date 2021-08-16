// This module is named like a Class, but is not. This is for compatibility with the existing os.dispatcher
goog.declareModuleId('os.Dispatcher');

import {dispatcher, setDispatcher} from './os.js';

const EventTarget = goog.requireType('goog.events.EventTarget');

/**
 * Get the global dispatcher.
 * @return {!EventTarget}
 * @todo Deprecate os.dispatcher and replace with a local instance here.
 */
export const getInstance = () => dispatcher;

/**
 * Set the global dispatcher.
 * @param {!EventTarget} value
 */
export const setInstance = (value) => {
  setDispatcher(value);
};

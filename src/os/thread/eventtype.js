goog.module('os.thread.EventType');


/**
 * Event types for threads
 * @enum {string}
 */
exports = {
  STOP: 'threadStop',
  START: 'threadStart',
  COMPLETE: 'threadComplete',
  ERROR: 'threadError',
  PROGRESS: 'threadProgress'
};

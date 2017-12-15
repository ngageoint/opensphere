goog.provide('os.thread.EventType');


/**
 * Event types for threads
 * @enum {string}
 */
os.thread.EventType = {
  STOP: 'threadStop',
  START: 'threadStart',
  COMPLETE: 'threadComplete',
  ERROR: 'threadError',
  PROGRESS: 'threadProgress'
};

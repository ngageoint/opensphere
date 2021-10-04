goog.declareModuleId('os.thread.EventType');

/**
 * Event types for threads
 * @enum {string}
 */
const EventType = {
  STOP: 'threadStop',
  START: 'threadStart',
  COMPLETE: 'threadComplete',
  ERROR: 'threadError',
  PROGRESS: 'threadProgress'
};

export default EventType;
